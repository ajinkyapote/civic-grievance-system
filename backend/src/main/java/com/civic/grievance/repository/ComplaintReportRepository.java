// 3. ComplaintReportRepository.java
package com.civic.grievance.repository;

import com.civic.grievance.entity.ComplaintReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintReportRepository extends JpaRepository<ComplaintReport, Long> {
    List<ComplaintReport> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ComplaintReport> findByMasterIssueId(Long masterIssueId);
}