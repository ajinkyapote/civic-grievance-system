package com.civic.grievance.service;

import com.civic.grievance.entity.MasterIssue;
import com.civic.grievance.repository.MasterIssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaMonitorService {

    private final MasterIssueRepository masterIssueRepository;
    private final PriorityScoringService priorityScoringService;

    /**
     * Checks unresolved tickets every 5 minutes. Any ticket past its SLA deadline
     * receives a +2.5 emergency escalation boost so it rises to the top of triage queues.
     */
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
            if (issue.getSlaDeadline() != null && now.isAfter(issue.getSlaDeadline())) {
                double baseScore = priorityScoringService.calculateSeverityScore(issue);
                double escalated = Math.round((baseScore + 2.5) * 100.0) / 100.0;
                if (issue.getSeverityScore() < escalated) {
                    issue.setSeverityScore(escalated);
                    masterIssueRepository.save(issue);
                    escalatedCount++;
                }
            }
        }

        if (escalatedCount > 0) {
            log.info("SLA Monitor: Escalated {} overdue civic grievance ticket(s).", escalatedCount);
        }
    }
}
