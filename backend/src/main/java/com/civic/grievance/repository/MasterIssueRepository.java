package com.civic.grievance.repository;

import com.civic.grievance.entity.MasterIssue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MasterIssueRepository extends JpaRepository<MasterIssue, Long> {
    List<MasterIssue> findByCategoryAndStatusIn(
        MasterIssue.Category category,
        List<MasterIssue.Status> statuses
    );
    List<MasterIssue> findByStatusInOrderBySeverityScoreDesc(
        List<MasterIssue.Status> statuses
    );
    List<MasterIssue> findByCategoryOrderBySeverityScoreDesc(MasterIssue.Category category);
    List<MasterIssue> findByAssignedToIdOrderBySeverityScoreDesc(Long engineerId);
    List<MasterIssue> findAllByOrderBySeverityScoreDesc();
}
