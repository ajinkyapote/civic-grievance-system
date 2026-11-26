package com.civic.grievance.dto;

import com.civic.grievance.entity.MasterIssue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    @NotNull(message = "New status is required")
    private MasterIssue.Status newStatus;
    private String remarks;
    private Long adminUserId;
}