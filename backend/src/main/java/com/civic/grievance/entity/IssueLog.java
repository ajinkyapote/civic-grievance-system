package com.civic.grievance.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "issue_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_issue_id", nullable = false)
    private MasterIssue masterIssue;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", nullable = false, length = 30)
    private MasterIssue.Status oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private MasterIssue.Status newStatus;

    @Column(length = 500)
    private String remarks;

    @Column(name = "proof_image_url", length = 500)
    private String proofImageUrl;

    @CreationTimestamp
    @Column(name = "updated_at", updatable = false)
    private LocalDateTime updatedAt;
}
