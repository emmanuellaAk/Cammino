-- Sprint 1: auth token tables + basic profile fields on users

-- Add profile fields to users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS university  VARCHAR(200),
    ADD COLUMN IF NOT EXISTS career_level VARCHAR(30),
    ADD COLUMN IF NOT EXISTS bio          TEXT,
    ADD COLUMN IF NOT EXISTS phone        VARCHAR(20);

-- Refresh tokens (hashed, single-use, rotated on every refresh)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id  ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Email verification tokens (plain UUID stored — low value, single-use)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    token      VARCHAR(36) NOT NULL UNIQUE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP   NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id);

-- Password reset tokens (hashed, single-use, 15-minute expiry)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP   NOT NULL,
    used       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);
