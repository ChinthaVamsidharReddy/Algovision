CREATE TABLE practice_questions (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    topic_id     bigint      NOT NULL REFERENCES topics (id) ON DELETE RESTRICT,
    algorithm_id bigint      REFERENCES algorithms (id) ON DELETE RESTRICT,
    prompt       text        NOT NULL,
    explanation  text        NOT NULL DEFAULT '',
    status       text        NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_practice_questions_topic ON practice_questions (topic_id, status);
CREATE TRIGGER trg_practice_questions_updated BEFORE UPDATE ON practice_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE question_options (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id bigint  NOT NULL REFERENCES practice_questions (id) ON DELETE CASCADE,
    label       text    NOT NULL,
    is_correct  boolean NOT NULL DEFAULT false,
    sort_order  integer NOT NULL DEFAULT 0
);
-- At most one correct option per question; "at least one" is enforced when a question is published.
CREATE UNIQUE INDEX uq_question_options_one_correct ON question_options (question_id) WHERE is_correct;

CREATE TABLE quiz_attempts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    question_id bigint      NOT NULL REFERENCES practice_questions (id) ON DELETE RESTRICT,
    option_id   bigint      NOT NULL REFERENCES question_options (id) ON DELETE RESTRICT,
    is_correct  boolean     NOT NULL,
    answered_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_quiz_attempts_user_question ON quiz_attempts (user_id, question_id, answered_at DESC);
