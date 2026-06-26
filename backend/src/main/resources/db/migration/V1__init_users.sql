-- Sprint 0: baseline schema
-- gen_random_uuid() requires pgcrypto (available by default in PostgreSQL 13+)

CREATE TABLE IF NOT EXISTS users (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email                VARCHAR(255) NOT NULL UNIQUE,
    password             VARCHAR(255) NOT NULL,
    first_name           VARCHAR(100) NOT NULL,
    last_name            VARCHAR(100) NOT NULL,
    role                 VARCHAR(20)  NOT NULL DEFAULT 'USER',
    email_verified       BOOLEAN      NOT NULL DEFAULT FALSE,
    enabled              BOOLEAN      NOT NULL DEFAULT TRUE,
    account_non_locked   BOOLEAN      NOT NULL DEFAULT TRUE,
    failed_login_attempts INTEGER     NOT NULL DEFAULT 0,
    lockout_expires_at   TIMESTAMP,
    created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
