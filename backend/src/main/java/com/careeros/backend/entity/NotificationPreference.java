package com.careeros.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private boolean deadlineRemindersEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private int deadlineReminderDaysBefore = 3;

    @Column(nullable = false)
    @Builder.Default
    private boolean followUpRemindersEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private int followUpReminderDaysAfterApply = 14;

    @Column(nullable = false)
    @Builder.Default
    private boolean statusChangeAlertsEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean aiAnalysisAlertsEnabled = true;
}
