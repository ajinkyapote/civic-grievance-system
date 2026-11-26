package com.civic.grievance.service;

import com.civic.grievance.dto.IssueReportRequest;
import com.civic.grievance.dto.IssueReportResponse;
import com.civic.grievance.entity.*;
import com.civic.grievance.repository.*;
import com.civic.grievance.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeduplicationService {

    private final MasterIssueRepository masterIssueRepository;
    private final ComplaintReportRepository complaintReportRepository;
    private final IssueLogRepository issueLogRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final TextSimilarityService textSimilarityService;
    private final PriorityScoringService priorityScoringService;

    @Value("${app.dedup.radius-meters:50.0}")
    private double radiusThresholdMeters;

    @Value("${app.dedup.similarity-threshold:0.65}")
    private double similarityThreshold;

    @Transactional
    public IssueReportResponse processComplaint(IssueReportRequest request, User authenticatedUser) {
        User reporter = authenticatedUser != null
            ? authenticatedUser
            : resolveOrCreateReporter(request.getUserId());

        List<MasterIssue> candidates = masterIssueRepository.findByCategoryAndStatusIn(
            request.getCategory(),
            List.of(
                MasterIssue.Status.OPEN,
                MasterIssue.Status.ASSIGNED,
                MasterIssue.Status.IN_PROGRESS,
                MasterIssue.Status.REOPENED
            )
        );

        String incomingText = request.getTitle() + " " + request.getDescription();
        MasterIssue bestMatch = null;
        double bestSimilarity = 0.0;
        double bestDistance = 0.0;

        for (MasterIssue candidate : candidates) {
            double distance = GeoUtils.calculateHaversineDistance(
                request.getLatitude(), request.getLongitude(),
                candidate.getLatitude(), candidate.getLongitude()
            );

            if (distance <= radiusThresholdMeters) {
                String candidateText = candidate.getTitle() + " " + candidate.getDescription();
                double similarity = textSimilarityService.computeCosineSimilarity(incomingText, candidateText);

                if (similarity >= similarityThreshold && similarity > bestSimilarity) {
                    bestSimilarity = similarity;
                    bestDistance = distance;
                    bestMatch = candidate;
                }
            }
        }

        if (bestMatch != null) {
            bestMatch.setDuplicateCount(bestMatch.getDuplicateCount() + 1);
            bestMatch.setSeverityScore(priorityScoringService.calculateSeverityScore(bestMatch));
            if (bestMatch.getBeforeImageUrl() == null && request.getImageUrl() != null) {
                bestMatch.setBeforeImageUrl(request.getImageUrl());
            }
            MasterIssue savedMaster = masterIssueRepository.save(bestMatch);

            String candidateText = savedMaster.getTitle() + " " + savedMaster.getDescription();
            List<String> sharedTokens = textSimilarityService.getMatchedKeywords(incomingText, candidateText);

            ComplaintReport report = ComplaintReport.builder()
                .masterIssue(savedMaster)
                .user(reporter)
                .rawDescription(request.getDescription())
                .submittedLat(request.getLatitude())
                .submittedLng(request.getLongitude())
                .similarityScore(Math.round(bestSimilarity * 1000.0) / 1000.0)
                .build();
            ComplaintReport savedReport = complaintReportRepository.save(report);

            String wardLabel = savedMaster.getWard() != null ? savedMaster.getWard().getWardName() : "Municipal Zone";
            double boost = Math.round(2.0 * Math.log(1 + savedMaster.getDuplicateCount()) * 100.0) / 100.0;

            return IssueReportResponse.builder()
                .action("MERGED")
                .message("Clustered into existing Master Ticket " + savedMaster.getTicketCode())
                .ticketCode(savedMaster.getTicketCode())
                .wardName(wardLabel)
                .masterIssueId(savedMaster.getId())
                .complaintReportId(savedReport.getId())
                .similarityScore(savedReport.getSimilarityScore())
                .distanceMeters(Math.round(bestDistance * 100.0) / 100.0)
                .totalDuplicates(savedMaster.getDuplicateCount())
                .updatedSeverityScore(savedMaster.getSeverityScore())
                .status(savedMaster.getStatus())
                .matchedKeywords(sharedTokens)
                .priorityFormulaBreakdown("Base Category Weight + Community Boost (2×ln(1+" + savedMaster.getDuplicateCount() + ") = +" + boost + ") + SLA Aging")
                .build();
        }

        Ward nearestWard = wardRepository.findAll().stream()
            .min(Comparator.comparingDouble(w ->
                GeoUtils.calculateHaversineDistance(request.getLatitude(), request.getLongitude(), w.getCenterLat(), w.getCenterLng())
            ))
            .orElse(null);

        int slaHours = switch (request.getCategory()) {
            case ELECTRICITY -> 12;
            case WATER -> 24;
            case ROADS -> 48;
            case SANITATION -> 24;
            case OTHER -> 72;
        };

        MasterIssue newMaster = MasterIssue.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .category(request.getCategory())
            .ward(nearestWard)
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .beforeImageUrl(request.getImageUrl())
            .status(MasterIssue.Status.OPEN)
            .escalationLevel(MasterIssue.EscalationLevel.L1_NORMAL)
            .duplicateCount(1)
            .slaDeadline(LocalDateTime.now().plusHours(slaHours))
            .build();
        newMaster.setSeverityScore(priorityScoringService.calculateSeverityScore(newMaster));
        MasterIssue savedMaster = masterIssueRepository.save(newMaster);

        savedMaster.setTicketCode(String.format("CIV-2026-%04d", savedMaster.getId()));
        savedMaster = masterIssueRepository.save(savedMaster);

        issueLogRepository.save(IssueLog.builder()
            .masterIssue(savedMaster)
            .actor(reporter)
            .oldStatus(MasterIssue.Status.OPEN)
            .newStatus(MasterIssue.Status.OPEN)
            .remarks("Registered & geo-fenced to " + (nearestWard != null ? nearestWard.getWardCode() : "City"))
            .proofImageUrl(request.getImageUrl())
            .build());

        ComplaintReport initialReport = ComplaintReport.builder()
            .masterIssue(savedMaster)
            .user(reporter)
            .rawDescription(request.getDescription())
            .submittedLat(request.getLatitude())
            .submittedLng(request.getLongitude())
            .similarityScore(1.0)
            .build();
        ComplaintReport savedReport = complaintReportRepository.save(initialReport);

        List<String> initialTokens = textSimilarityService.getMatchedKeywords(incomingText, incomingText);

        return IssueReportResponse.builder()
            .action("CREATED")
            .message("New Master Ticket " + savedMaster.getTicketCode() + " Registered")
            .ticketCode(savedMaster.getTicketCode())
            .wardName(nearestWard != null ? nearestWard.getWardName() : "Municipal Zone")
            .masterIssueId(savedMaster.getId())
            .complaintReportId(savedReport.getId())
            .similarityScore(1.0)
            .distanceMeters(0.0)
            .totalDuplicates(1)
            .updatedSeverityScore(savedMaster.getSeverityScore())
            .status(savedMaster.getStatus())
            .matchedKeywords(initialTokens)
            .priorityFormulaBreakdown("Initial Base Hazard Weight + 1st Report Escalation (" + slaHours + "h SLA assigned)")
            .build();
    }

    public IssueReportResponse processComplaint(IssueReportRequest request) {
        return processComplaint(request, null);
    }

    private User resolveOrCreateReporter(Long userId) {
        if (userId != null) {
            return userRepository.findById(userId).orElseGet(this::getDefaultCitizen);
        }
        return getDefaultCitizen();
    }

    private User getDefaultCitizen() {
        return userRepository.findByEmail("citizen@civic.gov.in")
            .orElseGet(() -> userRepository.findAll().stream().findFirst().orElseThrow());
    }
}
