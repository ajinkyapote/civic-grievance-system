package com.civic.grievance.service;

import com.civic.grievance.entity.MasterIssue;
import com.civic.grievance.repository.MasterIssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaMonitorService {

    private final MasterIssueRepository masterIssueRepository;
    private final PriorityScoringService priorityScoringService;

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void escalateOverdueTickets() {
        List<MasterIssue> active = masterIssueRepository.findByStatusInOrderBySeverityScoreDesc(
            List.of(
                MasterIssue.Status.OPEN,
                MasterIssue.Status.ASSIGNED,
                MasterIssue.Status.IN_PROGRESS,
                MasterIssue.Status.REOPENED
            )
        );

        LocalDateTime now = LocalDateTime.now();
        int escalatedCount = 0;

        for (MasterIssue issue : active) {
            if (issue.getSlaDeadline() == null) continue;
            long minutesRemaining = Duration.between(now, issue.getSlaDeadline()).toMinutes();

            if (minutesRemaining < 0) {
                issue.setEscalationLevel(MasterIssue.EscalationLevel.L3_CRITICAL_BREACH);
                double baseScore = priorityScoringService.calculateSeverityScore(issue);
                double escalated = Math.round((baseScore + 3.0) * 100.0) / 100.0;
                if (issue.getSeverityScore() < escalated) {
                    issue.setSeverityScore(escalated);
                }
                masterIssueRepository.save(issue);
                escalatedCount++;
            } else if (minutesRemaining <= 240 && issue.getEscalationLevel() == MasterIssue.EscalationLevel.L1_NORMAL) {
                issue.setEscalationLevel(MasterIssue.EscalationLevel.L2_SLA_WARNING);
                masterIssueRepository.save(issue);
            }
        }

        if (escalatedCount > 0) {
            log.info("SLA Governance Engine: Flagged {} ticket(s) as L3_CRITICAL_BREACH.", escalatedCount);
        }
    }
}
