package com.civic.grievance.dto;

import com.civic.grievance.entity.MasterIssue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IssueReportRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Category is required")
    private MasterIssue.Category category;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String imageUrl;

    // Optional until JWT login is wired; defaults to a demo citizen user
    private Long userId;
}