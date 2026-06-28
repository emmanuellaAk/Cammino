-- ─── Notification Preferences ────────────────────────────────────────────────
CREATE TABLE notification_preferences (
    id                                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                               UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    deadline_reminders_enabled            BOOLEAN NOT NULL DEFAULT TRUE,
    deadline_reminder_days_before         INTEGER NOT NULL DEFAULT 3,
    follow_up_reminders_enabled           BOOLEAN NOT NULL DEFAULT TRUE,
    follow_up_reminder_days_after_apply   INTEGER NOT NULL DEFAULT 14,
    status_change_alerts_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    ai_analysis_alerts_enabled            BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50)  NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT,
    related_job_id  UUID                     REFERENCES jobs(id) ON DELETE SET NULL,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id       ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread   ON notifications(user_id) WHERE is_read = FALSE;
