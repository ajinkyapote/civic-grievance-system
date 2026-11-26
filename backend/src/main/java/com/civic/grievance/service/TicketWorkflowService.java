package com.civic.grievance.service;

import com.civic.grievance.entity.IssueLog;
import com.civic.grievance.entity.MasterIssue;
import com.civic.grievance.entity.User;
import com.civic.grievance.repository.IssueLogRepository;
import com.civic.grievance.repository.MasterIssueRepository;
import com.civic.grievance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketWorkflowService {

    private final MasterIssueRepository masterIssueRepository;
    private final UserRepository userRepository;
    private final IssueLogRepository issueLogRepository;

    @Transactional
    public MasterIssue assignToFieldEngineer(Long issueId, Long engineerId, User officer, String remarks) {
        MasterIssue issue = masterIssueRepository.findById(issueId)
            .orElseThrow(() -> new RuntimeException("Ticket not found: " + issueId));
        User engineer = userRepository.findById(engineerId)
            .orElseThrow(() -> new RuntimeException("Field engineer not found: " + engineerId));

        MasterIssue.Status oldStatus = issue.getStatus();
        issue.setAssignedTo(engineer);
        issue.setStatus(MasterIssue.Status.ASSIGNED);
        MasterIssue saved = masterIssueRepository.save(issue);

        issueLogRepository.save(IssueLog.builder()
            .masterIssue(saved)
            .actor(officer)
            .oldStatus(oldStatus)
            .newStatus(MasterIssue.Status.ASSIGNED)
            .remarks(remarks != null && !remarks.isBlank()
                ? remarks
                : "Assigned to Field Engineer: " + engineer.getName())
            .build());

        return saved;
    }

    @Transactional
    public MasterIssue updateFieldProgress(
            Long issueId, MasterIssue.Status newStatus, String remarks, String proofImageUrl, User engineer) {
        MasterIssue issue = masterIssueRepository.findById(issueId)
            .orElseThrow(() -> new RuntimeException("Ticket not found: " + issueId));

        MasterIssue.Status oldStatus = issue.getStatus();
        issue.setStatus(newStatus);
        if (proofImageUrl != null && !proofImageUrl.isBlank()) {
            issue.setAfterImageUrl(proofImageUrl);
        }
        MasterIssue saved = masterIssueRepository.save(issue);

        issueLogRepository.save(IssueLog.builder()
            .masterIssue(saved)
            .actor(engineer)
            .oldStatus(oldStatus)
            .newStatus(newStatus)
            .remarks(remarks)
            .proofImageUrl(proofImageUrl)
            .build());

        return saved;
    }

    @Transactional
    public MasterIssue submitCitizenVerification(
            Long issueId, boolean satisfied, Integer rating, String feedback, User citizen) {
        MasterIssue issue = masterIssueRepository.findById(issueId)
            .orElseThrow(() -> new RuntimeException("Ticket not found: " + issueId));

        MasterIssue.Status oldStatus = issue.getStatus();
        MasterIssue.Status nextStatus = satisfied ? MasterIssue.Status.CLOSED : MasterIssue.Status.REOPENED;

        issue.setStatus(nextStatus);
        if (rating != null) {
            issue.setCitizenRating(rating);
        }
        if (feedback != null) {
            issue.setCitizenFeedback(feedback);
        }
        MasterIssue saved = masterIssueRepository.save(issue);

        issueLogRepository.save(IssueLog.builder()
            .masterIssue(saved)
            .actor(citizen)
            .oldStatus(oldStatus)
            .newStatus(nextStatus)
            .remarks(satisfied
                ? "Citizen verified resolution (Rating: " + rating + "/5) - " + feedback
                : "Citizen rejected resolution and REOPENED ticket: " + feedback)
            .build());

        return saved;
    }
}
