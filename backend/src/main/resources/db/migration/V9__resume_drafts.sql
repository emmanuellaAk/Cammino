-- Resume builder: in-app authored/edited resumes (MDX content), distinct from
-- uploaded resume files in `resumes`. Editable via direct save or AI chat.

CREATE TABLE resume_drafts (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(200) NOT NULL,
    mdx_content  TEXT         NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resume_drafts_user_id ON resume_drafts(user_id);

CREATE TABLE resume_draft_messages (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id   UUID        NOT NULL REFERENCES resume_drafts(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL,  -- USER | ASSISTANT
    content    TEXT        NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resume_draft_messages_draft_id ON resume_draft_messages(draft_id);
