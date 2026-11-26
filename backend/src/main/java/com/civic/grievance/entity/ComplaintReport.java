package com.civic.grievance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_issue_id", nullable = false)
    private MasterIssue masterIssue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "raw_description", nullable = false, columnDefinition = "TEXT")
    private String rawDescription;

    @Column(name = "submitted_lat", nullable = false)
    private Double submittedLat;

    @Column(name = "submitted_lng", nullable = false)
    private Double submittedLng;

    @Column(name = "similarity_score", nullable = false)
    private Double similarityScore;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}