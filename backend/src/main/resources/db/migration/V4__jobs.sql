-- Sprint 3: job tracker

CREATE TABLE IF NOT EXISTS jobs (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_title   VARCHAR(255) NOT NULL,
    company     VARCHAR(255) NOT NULL,
    location    VARCHAR(255),
    job_url     VARCHAR(2000),
    description TEXT,
    salary      VARCHAR(100),
    status      VARCHAR(20)  NOT NULL DEFAULT 'SAVED',
    deadline    DATE,
    applied_at  DATE,
    source      VARCHAR(100),
    deleted_at  TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id   ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status    ON jobs(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_deadline  ON jobs(user_id, deadline) WHERE deadline IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_deleted   ON jobs(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS application_notes (
    id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id     UUID  NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    content    TEXT  NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_job_id ON application_notes(job_id);
