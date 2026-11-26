package com.civic.grievance.dto;

import com.civic.grievance.entity.MasterIssue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueReportResponse {
    private String action; // CREATED or MERGED
    private String message;
    private String ticketCode;
    private String wardName;
    private Long masterIssueId;
    private Long complaintReportId;
    private Double similarityScore;
    private Double distanceMeters;
    private Integer totalDuplicates;
    private Double updatedSeverityScore;
    private MasterIssue.Status status;
    private List<String> matchedKeywords;
    private String priorityFormulaBreakdown;
}
