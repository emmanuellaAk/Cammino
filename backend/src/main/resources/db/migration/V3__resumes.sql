-- Sprint 2: resume management

CREATE TABLE IF NOT EXISTS resumes (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_file_name VARCHAR(255) NOT NULL,
    storage_path       VARCHAR(500) NOT NULL,
    file_size          BIGINT       NOT NULL,
    mime_type          VARCHAR(100) NOT NULL,
    is_active          BOOLEAN      NOT NULL DEFAULT FALSE,
    uploaded_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id   ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_active ON resumes(user_id, is_active);
