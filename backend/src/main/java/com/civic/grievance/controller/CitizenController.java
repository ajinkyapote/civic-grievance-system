package com.civic.grievance.controller;

import com.civic.grievance.dto.IssueReportRequest;
import com.civic.grievance.dto.IssueReportResponse;
import com.civic.grievance.entity.ComplaintReport;
import com.civic.grievance.entity.IssueUpvote;
import com.civic.grievance.entity.MasterIssue;
import com.civic.grievance.entity.User;
import com.civic.grievance.repository.ComplaintReportRepository;
import com.civic.grievance.repository.IssueUpvoteRepository;
import com.civic.grievance.repository.MasterIssueRepository;
import com.civic.grievance.service.DeduplicationService;
import com.civic.grievance.service.PriorityScoringService;
import com.civic.grievance.service.TicketWorkflowService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/citizen")
@RequiredArgsConstructor
public class CitizenController {

    private final DeduplicationService deduplicationService;
    private final ComplaintReportRepository complaintReportRepository;
    private final MasterIssueRepository masterIssueRepository;
    private final IssueUpvoteRepository issueUpvoteRepository;
    private final PriorityScoringService priorityScoringService;
    private final TicketWorkflowService ticketWorkflowService;

    @Data
    public static class VerifyRequest {
        private boolean satisfied;
        private Integer rating;
        private String feedback;
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        Path uploadDir = Paths.get("uploads");
        if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);

        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "evidence.jpg";
        String ext = original.contains(".") ? original.substring(original.lastIndexOf(".")) : ".jpg";
        String filename = UUID.randomUUID() + ext;
        Files.copy(file.getInputStream(), uploadDir.resolve(filename));

        return ResponseEntity.ok(Map.of("imageUrl", "http://localhost:8080/uploads/" + filename));
    }

    @PostMapping("/report")
    public ResponseEntity<IssueReportResponse> submitComplaint(
            @Valid @RequestBody IssueReportRequest request,
            @AuthenticationPrincipal User citizen) {
        return ResponseEntity.ok(deduplicationService.processComplaint(request, citizen));
    }

    @PostMapping("/issues/{id}/upvote")
    public ResponseEntity<?> upvoteExistingIssue(
            @PathVariable Long id,
            @AuthenticationPrincipal User citizen) {
        if (issueUpvoteRepository.existsByMasterIssueIdAndUserId(id, citizen.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "You have already supported/confirmed this grievance."));
        }

        MasterIssue issue = masterIssueRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

        issueUpvoteRepository.save(IssueUpvote.builder()
            .masterIssue(issue)
            .user(citizen)
            .build());

        issue.setDuplicateCount(issue.getDuplicateCount() + 1);
        issue.setSeverityScore(priorityScoringService.calculateSeverityScore(issue));
        MasterIssue saved = masterIssueRepository.save(issue);

        return ResponseEntity.ok(Map.of(
            "message", "Confirmed! Community upvote added to " + saved.getTicketCode(),
            "totalDuplicates", saved.getDuplicateCount(),
            "updatedSeverityScore", saved.getSeverityScore()
        ));
    }

    @GetMapping("/my-reports")
    public ResponseEntity<?> getMyReports(@AuthenticationPrincipal User citizen) {
        List<ComplaintReport> reports = complaintReportRepository.findByUserIdOrderByCreatedAtDesc(citizen.getId());
        var result = reports.stream().map(r -> {
            var m = r.getMasterIssue();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("reportId", r.getId());
            item.put("rawDescription", r.getRawDescription());
            item.put("similarityScore", r.getSimilarityScore());
            item.put("submittedAt", r.getCreatedAt());
            item.put("masterIssueId", m.getId());
            item.put("ticketCode", m.getTicketCode());
            item.put("masterTitle", m.getTitle());
            item.put("category", m.getCategory());
            item.put("wardName", m.getWard() != null ? m.getWard().getWardName() : "Central");
            item.put("status", m.getStatus());
            item.put("escalationLevel", m.getEscalationLevel());
            item.put("totalDuplicates", m.getDuplicateCount());
            item.put("severityScore", m.getSeverityScore());
            item.put("beforeImageUrl", m.getBeforeImageUrl());
            item.put("afterImageUrl", m.getAfterImageUrl());
            item.put("assignedEngineer", m.getAssignedTo() != null ? m.getAssignedTo().getName() : "Unassigned");
            item.put("citizenRating", m.getCitizenRating());
            return item;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/issues/{id}/verify")
    public ResponseEntity<?> verifyResolution(
            @PathVariable Long id,
            @RequestBody VerifyRequest req,
            @AuthenticationPrincipal User citizen) {
        return ResponseEntity.ok(
            ticketWorkflowService.submitCitizenVerification(id, req.isSatisfied(), req.getRating(), req.getFeedback(), citizen)
        );
    }
}
