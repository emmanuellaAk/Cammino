-- ─── AI: Resume Analyses ───────────────────────────────────────────────────
CREATE TABLE resume_analyses (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id      UUID         NOT NULL REFERENCES resumes(id)  ON DELETE CASCADE,
    user_id        UUID         NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    skills         JSONB,
    experience_years INTEGER,
    education      VARCHAR(255),
    strengths      JSONB,
    summary        TEXT,
    analyzed_at    TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_resume_analysis UNIQUE (resume_id)
);

CREATE INDEX idx_resume_analyses_user_id  ON resume_analyses(user_id);
CREATE INDEX idx_resume_analyses_resume_id ON resume_analyses(resume_id);

-- ─── AI: Job Matches ────────────────────────────────────────────────────────
CREATE TABLE job_matches (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id           UUID    NOT NULL REFERENCES jobs(id)    ON DELETE CASCADE,
    resume_id        UUID    NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    user_id          UUID    NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    match_score      INTEGER,
    matching_skills  JSONB,
    missing_skills   JSONB,
    recommendations  JSONB,
    summary          TEXT,
    analyzed_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_job_match UNIQUE (job_id, resume_id)
);

CREATE INDEX idx_job_matches_user_id  ON job_matches(user_id);
CREATE INDEX idx_job_matches_job_id   ON job_matches(job_id);
