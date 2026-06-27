-- ─── Gmail Connections ──────────────────────────────────────────────────────
CREATE TABLE gmail_connections (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    gmail_address     VARCHAR(255) NOT NULL,
    access_token_enc  TEXT         NOT NULL,
    refresh_token_enc TEXT         NOT NULL,
    token_expiry      TIMESTAMP    NOT NULL,
    scopes            TEXT         NOT NULL,
    connected_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_sync_at      TIMESTAMP
);

-- ─── Email Scan Results ──────────────────────────────────────────────────────
CREATE TABLE email_scan_results (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    job_id           UUID                     REFERENCES jobs(id) ON DELETE SET NULL,
    gmail_message_id VARCHAR(255) NOT NULL,
    subject          TEXT,
    from_address     VARCHAR(512),
    received_at      TIMESTAMP,
    inferred_status  VARCHAR(50),
    confidence       VARCHAR(20)  NOT NULL,
    status_applied   BOOLEAN      NOT NULL DEFAULT FALSE,
    scanned_at       TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_email_scan UNIQUE (user_id, gmail_message_id)
);

CREATE INDEX idx_email_scan_results_user_id ON email_scan_results(user_id);
CREATE INDEX idx_email_scan_results_job_id  ON email_scan_results(job_id);
