package com.civic.grievance.controller;

import com.civic.grievance.entity.MasterIssue;
import com.civic.grievance.entity.Ward;
import com.civic.grievance.repository.IssueLogRepository;
import com.civic.grievance.repository.MasterIssueRepository;
import com.civic.grievance.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicTransparencyController {

    private final MasterIssueRepository masterIssueRepository;
    private final IssueLogRepository issueLogRepository;
    private final WardRepository wardRepository;

    @GetMapping("/issues")
    public ResponseEntity<List<MasterIssue>> getAllPublicIssues() {
        return ResponseEntity.ok(masterIssueRepository.findAllByOrderBySeverityScoreDesc());
    }

    @GetMapping("/wards")
    public ResponseEntity<List<Ward>> getAllWards() {
        return ResponseEntity.ok(wardRepository.findAll());
    }

    @GetMapping("/issues/{id}/logs")
    public ResponseEntity<?> getTicketAuditLogs(@PathVariable Long id) {
        return ResponseEntity.ok(issueLogRepository.findByMasterIssueIdOrderByUpdatedAtDesc(id));
    }
}
