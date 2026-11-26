package com.civic.grievance.controller;

import com.civic.grievance.entity.MasterIssue;
import com.civic.grievance.entity.User;
import com.civic.grievance.repository.ComplaintReportRepository;
import com.civic.grievance.repository.MasterIssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final MasterIssueRepository masterIssueRepository;
    private final ComplaintReportRepository complaintReportRepository;

    @GetMapping
    public ResponseEntity<?> getRoleNotifications(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }

        var alerts = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        if (user.getRole() == User.Role.CITIZEN) {
            var myReports = complaintReportRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            for (var r : myReports) {
                var m = r.getMasterIssue();
                if (m.getStatus() == MasterIssue.Status.RESOLVED) {
                    alerts.add(buildAlert(
                        "ACTION_REQUIRED",
                        m.getTicketCode() + " Resolved — Verify & Rate",
                        "Field engineer submitted proof for '" + m.getTitle() + "'. Confirm closure or reopen.",
                        "/citizen"
                    ));
                } else if (m.getStatus() == MasterIssue.Status.ASSIGNED || m.getStatus() == MasterIssue.Status.IN_PROGRESS) {
                    alerts.add(buildAlert(
                        "INFO",
                        m.getTicketCode() + " Crew Dispatched",
                        "Assigned to " + (m.getAssignedTo() != null ? m.getAssignedTo().getName() : "Municipal Crew"),
                        "/citizen"
                    ));
                }
            }
        } else if (user.getRole() == User.Role.DEPT_OFFICER) {
            MasterIssue.Category cat = MasterIssue.Category.valueOf(user.getDepartment().name());
            var deptIssues = masterIssueRepository.findByCategoryOrderBySeverityScoreDesc(cat);
            for (var m : deptIssues) {
                if (m.getStatus() == MasterIssue.Status.OPEN || m.getStatus() == MasterIssue.Status.REOPENED) {
                    alerts.add(buildAlert(
                        "WARNING",
                        "Unassigned " + m.getStatus() + " Ticket: " + m.getTicketCode(),
                        m.getTitle() + " (" + m.getDuplicateCount() + " citizen reports, Severity " + m.getSeverityScore() + ")",
                        "/department"
                    ));
                }
            }
        } else if (user.getRole() == User.Role.FIELD_ENGINEER) {
            var tasks = masterIssueRepository.findByAssignedToIdOrderBySeverityScoreDesc(user.getId());
            for (var m : tasks) {
                if (m.getStatus() == MasterIssue.Status.ASSIGNED || m.getStatus() == MasterIssue.Status.IN_PROGRESS) {
                    alerts.add(buildAlert(
                        "INFO",
                        "Active Work Order: " + m.getTicketCode(),
                        m.getTitle() + " (" + (m.getWard() != null ? m.getWard().getWardName() : "Assigned Sector") + ")",
                        "/field"
                    ));
                }
            }
        } else if (user.getRole() == User.Role.SUPER_ADMIN) {
            var all = masterIssueRepository.findAllByOrderBySeverityScoreDesc();
            for (var m : all) {
                boolean overdue = m.getSlaDeadline() != null
                    && now.isAfter(m.getSlaDeadline())
                    && m.getStatus() != MasterIssue.Status.RESOLVED
                    && m.getStatus() != MasterIssue.Status.CLOSED;

                if (overdue || m.getDuplicateCount() >= 3) {
                    alerts.add(buildAlert(
                        overdue ? "CRITICAL" : "WARNING",
                        (overdue ? "SLA BREACH: " : "HIGH CLUSTER: ") + m.getTicketCode(),
                        m.getTitle() + " — " + m.getDuplicateCount() + " reports | Status: " + m.getStatus(),
                        "/admin"
                    ));
                }
            }
        }

        return ResponseEntity.ok(alerts.stream().limit(10).toList());
    }

    private Map<String, Object> buildAlert(String level, String title, String detail, String link) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("level", level);
        map.put("title", title);
        map.put("detail", detail);
        map.put("link", link);
        return map;
    }
}
