package com.civic.grievance.controller;

import com.civic.grievance.entity.MasterIssue;
import com.civic.grievance.entity.User;
import com.civic.grievance.repository.MasterIssueRepository;
import com.civic.grievance.repository.UserRepository;
import com.civic.grievance.service.TicketWorkflowService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ops")
@RequiredArgsConstructor
public class OperationsController {

    private final MasterIssueRepository masterIssueRepository;
    private final UserRepository userRepository;
    private final TicketWorkflowService ticketWorkflowService;

    @Data
    public static class AssignRequest {
        private Long engineerId;
        private String remarks;
    }

    @Data
    public static class FieldUpdateRequest {
        private MasterIssue.Status newStatus;
        private String remarks;
        private String proofImageUrl;
    }

    @GetMapping("/department/issues")
    public ResponseEntity<List<MasterIssue>> getDepartmentIssues(@AuthenticationPrincipal User officer) {
        if (officer.getRole() == User.Role.SUPER_ADMIN || officer.getDepartment() == User.Department.ALL) {
            return ResponseEntity.ok(masterIssueRepository.findAllByOrderBySeverityScoreDesc());
        }
        MasterIssue.Category cat = MasterIssue.Category.valueOf(officer.getDepartment().name());
        return ResponseEntity.ok(masterIssueRepository.findByCategoryOrderBySeverityScoreDesc(cat));
    }

    @GetMapping("/department/engineers")
    public ResponseEntity<List<User>> getDepartmentEngineers(@AuthenticationPrincipal User officer) {
        if (officer.getRole() == User.Role.SUPER_ADMIN || officer.getDepartment() == User.Department.ALL) {
            return ResponseEntity.ok(userRepository.findByRole(User.Role.FIELD_ENGINEER));
        }
        return ResponseEntity.ok(userRepository.findByRoleAndDepartment(User.Role.FIELD_ENGINEER, officer.getDepartment()));
    }

    @PatchMapping("/department/issues/{id}/assign")
    public ResponseEntity<MasterIssue> assignTicket(
            @PathVariable Long id,
            @RequestBody AssignRequest req,
            @AuthenticationPrincipal User officer) {
        return ResponseEntity.ok(
            ticketWorkflowService.assignToFieldEngineer(id, req.getEngineerId(), officer, req.getRemarks())
        );
    }

    @GetMapping("/field/tasks")
    public ResponseEntity<List<MasterIssue>> getFieldEngineerTasks(@AuthenticationPrincipal User engineer) {
        if (engineer.getRole() == User.Role.SUPER_ADMIN) {
            return ResponseEntity.ok(masterIssueRepository.findAllByOrderBySeverityScoreDesc());
        }
        return ResponseEntity.ok(masterIssueRepository.findByAssignedToIdOrderBySeverityScoreDesc(engineer.getId()));
    }

    @PostMapping("/field/upload-proof")
    public ResponseEntity<?> uploadAfterProof(@RequestParam("file") MultipartFile file) throws IOException {
        Path uploadDir = Paths.get("uploads");
        if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);

        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "proof.jpg";
        String ext = original.contains(".") ? original.substring(original.lastIndexOf(".")) : ".jpg";
        String filename = "proof-" + UUID.randomUUID() + ext;
        Files.copy(file.getInputStream(), uploadDir.resolve(filename));

        return ResponseEntity.ok(Map.of("proofImageUrl", "http://localhost:8080/uploads/" + filename));
    }

    @PatchMapping("/field/tasks/{id}/status")
    public ResponseEntity<MasterIssue> updateFieldStatus(
            @PathVariable Long id,
            @RequestBody FieldUpdateRequest req,
            @AuthenticationPrincipal User engineer) {
        return ResponseEntity.ok(
            ticketWorkflowService.updateFieldProgress(id, req.getNewStatus(), req.getRemarks(), req.getProofImageUrl(), engineer)
        );
    }
}
