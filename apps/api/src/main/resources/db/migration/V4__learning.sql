-- Per-user learning records. Progress and bookmarks are per algorithm so "continue" can resume exactly.
CREATE TABLE user_preferences (
    user_id        uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    language_code  text REFERENCES programming_languages (code) ON DELETE SET NULL,
    theme          text NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
    playback_speed numeric(3, 1) NOT NULL DEFAULT 1.0 CHECK (playback_speed IN (0.5, 1.0, 1.5, 2.0)),
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_user_preferences_updated BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE user_progress (
    user_id            uuid   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    algorithm_id       bigint NOT NULL REFERENCES algorithms (id) ON DELETE RESTRICT,
    status             text   NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
    last_language_code text   REFERENCES programming_languages (code) ON DELETE SET NULL,
    first_viewed_at    timestamptz NOT NULL DEFAULT now(),
    last_viewed_at     timestamptz NOT NULL DEFAULT now(),
    completed_at       timestamptz,
    PRIMARY KEY (user_id, algorithm_id),
    CONSTRAINT ck_user_progress_completed CHECK ((status = 'COMPLETED') = (completed_at IS NOT NULL))
);
CREATE INDEX ix_user_progress_recent ON user_progress (user_id, last_viewed_at DESC);

CREATE TABLE bookmarks (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    algorithm_id bigint      NOT NULL REFERENCES algorithms (id) ON DELETE RESTRICT,
    created_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_bookmarks UNIQUE (user_id, algorithm_id)
);
CREATE INDEX ix_bookmarks_user ON bookmarks (user_id, created_at DESC);

CREATE TABLE learning_activity (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    event_type   text        NOT NULL CHECK (event_type IN ('VIEWED', 'COMPLETED', 'QUIZ_ANSWERED', 'BOOKMARKED')),
    algorithm_id bigint      REFERENCES algorithms (id) ON DELETE SET NULL,
    occurred_at  timestamptz NOT NULL DEFAULT now(),
    metadata     jsonb       NOT NULL DEFAULT '{}'
);
CREATE INDEX ix_learning_activity_user ON learning_activity (user_id, occurred_at DESC);
