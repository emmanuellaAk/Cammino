package com.careeros.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_scan_results")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailScanResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    @Column(nullable = false, length = 255)
    private String gmailMessageId;

    @Column(columnDefinition = "TEXT")
    private String subject;

    @Column(length = 512)
    private String fromAddress;

    private LocalDateTime receivedAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ApplicationStatus inferredStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScanConfidence confidence;

    @Column(nullable = false)
    @Builder.Default
    private boolean statusApplied = false;

    @Column(nullable = false)
    private LocalDateTime scannedAt;

    @PrePersist
    protected void onCreate() {
        scannedAt = LocalDateTime.now();
    }
}
