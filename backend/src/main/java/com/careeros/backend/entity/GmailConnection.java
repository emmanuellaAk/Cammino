package com.careeros.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "gmail_connections")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GmailConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 255)
    private String gmailAddress;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String accessTokenEnc;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String refreshTokenEnc;

    @Column(nullable = false)
    private LocalDateTime tokenExpiry;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String scopes;

    @Column(nullable = false)
    private LocalDateTime connectedAt;

    private LocalDateTime lastSyncAt;

    @PrePersist
    protected void onCreate() {
        connectedAt = LocalDateTime.now();
    }
}
