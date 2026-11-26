package com.civic.grievance.repository;

import com.civic.grievance.entity.IssueUpvote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IssueUpvoteRepository extends JpaRepository<IssueUpvote, Long> {
    boolean existsByMasterIssueIdAndUserId(Long masterIssueId, Long userId);
}
