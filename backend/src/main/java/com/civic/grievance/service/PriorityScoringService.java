package com.civic.grievance.service;

import com.civic.grievance.entity.MasterIssue;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class PriorityScoringService {

    /**
     * Calculates dynamic urgency score based on category hazard weight,
     * logarithmic community duplicate volume, and unresolved ticket age.
     */
    public double calculateSeverityScore(MasterIssue issue) {
        double baseWeight = switch (issue.getCategory()) {
            case ELECTRICITY -> 4.0; // Exposed wires / outages = highest immediate hazard
            case WATER -> 3.5;       // Burst pipes / contamination
            case ROADS -> 3.0;       // Deep potholes / cave-ins
            case SANITATION -> 2.5;  // Overflowing garbage / sewage
            case OTHER -> 1.5;
        };

        int duplicates = issue.getDuplicateCount() != null ? issue.getDuplicateCount() : 1;
        double crowdBoost = 2.0 * Math.log1p(duplicates);

        long ageHours = 0;
        if (issue.getCreatedAt() != null) {
            ageHours = Math.max(0, Duration.between(issue.getCreatedAt(), LocalDateTime.now()).toHours());
        }
        double ageBoost = Math.min(3.0, ageHours * 0.05);

        double rawScore = baseWeight + crowdBoost + ageBoost;
        return Math.round(rawScore * 100.0) / 100.0;
    }
}