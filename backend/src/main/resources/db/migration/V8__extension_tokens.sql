-- ─── Browser Extension Personal Access Tokens ────────────────────────────────
CREATE TABLE extension_tokens (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   VARCHAR(64)  NOT NULL UNIQUE,
    label        VARCHAR(100),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP,
    expires_at   TIMESTAMP
);

CREATE INDEX idx_extension_tokens_user_id    ON extension_tokens(user_id);
CREATE INDEX idx_extension_tokens_token_hash ON extension_tokens(token_hash);
