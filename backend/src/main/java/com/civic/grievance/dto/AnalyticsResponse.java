package com.civic.grievance.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class AnalyticsResponse {
    private long totalRawComplaints;
    private long uniqueMasterIssues;
    private long duplicatesEliminated;
    private double deduplicationRatePercent;
    private Map<String, Long> issuesByCategory;
    private Map<String, Long> issuesByStatus;
}