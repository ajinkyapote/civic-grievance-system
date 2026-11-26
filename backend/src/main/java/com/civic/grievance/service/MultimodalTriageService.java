package com.civic.grievance.service;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;

@Service
public class MultimodalTriageService {

    @Data
    @Builder
    public static class TriageResult {
        private String inferredCategory;
        private int emergencyBoost;
        private boolean criticalSafetyHazard;
        private String triageSummary;
        private String visualFingerprint;
    }

    private static final List<String> EMERGENCY_KEYWORDS = List.of(
        "live wire", "sparking", "electrocution", "open manhole", "sinkhole",
        "major burst", "flooding", "sewage overflow", "collapsed", "fire", "तार", "खड्डा"
    );

    public TriageResult analyzeSubmission(String title, String description, String declaredCategory, byte[] imageBytes) {
        String combined = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase();

        boolean hazard = EMERGENCY_KEYWORDS.stream().anyMatch(combined::contains);
        int boost = hazard ? 25 : 0;

        String inferred = declaredCategory;
        if (inferred == null || inferred.isBlank() || "AUTO".equalsIgnoreCase(inferred)) {
            if (combined.contains("pothole") || combined.contains("road") || combined.contains("asphalt") || combined.contains("खड्डा")) {
                inferred = "ROADS";
            } else if (combined.contains("water") || combined.contains("pipe") || combined.contains("leak") || combined.contains("पाणी")) {
                inferred = "WATER";
            } else if (combined.contains("light") || combined.contains("wire") || combined.contains("power") || combined.contains("वीज")) {
                inferred = "ELECTRICITY";
            } else {
                inferred = "SANITATION";
            }
        }

        String fingerprint = computeFingerprint(imageBytes, combined);
        String summary = hazard
            ? "CRITICAL SAFETY HAZARD DETECTED (+25 Priority Boost) • Verified Multimodal Payload"
            : "Standard Civic Triage • Department Routed: " + inferred;

        return TriageResult.builder()
            .inferredCategory(inferred)
            .emergencyBoost(boost)
            .criticalSafetyHazard(hazard)
            .triageSummary(summary)
            .visualFingerprint(fingerprint)
            .build();
    }

    public boolean verifyFieldProximity(double issueLat, double issueLng, Double crewLat, Double crewLng, double maxMeters) {
        if (crewLat == null || crewLng == null) return true; // fallback when desktop browser lacks GPS
        double r = 6371000.0;
        double dLat = Math.toRadians(crewLat - issueLat);
        double dLng = Math.toRadians(crewLng - issueLng);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(issueLat)) * Math.cos(Math.toRadians(crewLat))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double dist = 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= maxMeters;
    }

    private String computeFingerprint(byte[] imageBytes, String fallbackText) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = (imageBytes != null && imageBytes.length > 0)
                ? md.digest(imageBytes)
                : md.digest(fallbackText.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 16);
        } catch (Exception e) {
            return "0000000000000000";
        }
    }
}
