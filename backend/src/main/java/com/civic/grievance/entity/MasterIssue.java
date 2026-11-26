package com.civic.grievance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "master_issues", indexes = {
    @Index(name = "idx_category_status", columnList = "category, status"),
    @Index(name = "idx_severity", columnList = "severity_score")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MasterIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_code", unique = true, length = 30)
    private String ticketCode;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "before_image_url", length = 500)
    private String beforeImageUrl;

    @Column(name = "after_image_url", length = 500)
    private String afterImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private Status status = Status.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "escalation_level", nullable = false, length = 30)
    @Builder.Default
    private EscalationLevel escalationLevel = EscalationLevel.L1_NORMAL;

    @Column(name = "severity_score", nullable = false)
    @Builder.Default
    private Double severityScore = 1.0;

    @Column(name = "duplicate_count", nullable = false)
    @Builder.Default
    private Integer duplicateCount = 1;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "sla_deadline")
    private LocalDateTime slaDeadline;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "citizen_rating")
    private Integer citizenRating;

    @Column(name = "citizen_feedback", length = 500)
    private String citizenFeedback;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Category {
        ROADS, WATER, ELECTRICITY, SANITATION, OTHER
    }

    public enum Status {
        OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, REOPENED, CLOSED
    }

    public enum EscalationLevel {
        L1_NORMAL, L2_SLA_WARNING, L3_CRITICAL_BREACH
    }
}
