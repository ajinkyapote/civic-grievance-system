// 4. IssueLogRepository.java
package com.civic.grievance.repository;

import com.civic.grievance.entity.IssueLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IssueLogRepository extends JpaRepository<IssueLog, Long> {
    List<IssueLog> findByMasterIssueIdOrderByUpdatedAtDesc(Long masterIssueId);
}