-- Shared catalog. Public bigint identity keys plus slugs in URLs. Rows are archived via status,
-- never deleted once anyone has progress on them (ON DELETE RESTRICT below).
CREATE TABLE programming_languages (
    code         text PRIMARY KEY CHECK (code ~ '^[a-z][a-z0-9]*$'),
    display_name text     NOT NULL,
    editor_id    text     NOT NULL,
    sort_order   smallint NOT NULL,
    enabled      boolean  NOT NULL DEFAULT true
);
INSERT INTO programming_languages (code, display_name, editor_id, sort_order) VALUES
    ('java', 'Java', 'java', 1),
    ('python', 'Python', 'python', 2),
    ('cpp', 'C++', 'cpp', 3),
    ('c', 'C', 'c', 4);

CREATE TABLE categories (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug        text        NOT NULL,
    name        text        NOT NULL,
    description text        NOT NULL DEFAULT '',
    status      text        NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    sort_order  integer     NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_categories_slug UNIQUE (slug),
    CONSTRAINT ck_categories_slug CHECK (slug ~ '^[a-z][a-z0-9-]*$')
);
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE topics (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id bigint      NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    slug        text        NOT NULL,
    name        text        NOT NULL,
    difficulty  text        NOT NULL CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    summary     text        NOT NULL DEFAULT '',
    objectives  text[]      NOT NULL DEFAULT '{}',
    status      text        NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    sort_order  integer     NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_topics_slug UNIQUE (slug),
    CONSTRAINT ck_topics_slug CHECK (slug ~ '^[a-z][a-z0-9-]*$')
);
CREATE INDEX ix_topics_category ON topics (category_id, sort_order);
CREATE TRIGGER trg_topics_updated BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE topic_relations (
    topic_id         bigint NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
    related_topic_id bigint NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
    type             text   NOT NULL CHECK (type IN ('PREREQUISITE', 'RELATED')),
    PRIMARY KEY (topic_id, related_topic_id, type),
    CONSTRAINT ck_topic_relations_no_self CHECK (topic_id <> related_topic_id)
);

CREATE TABLE algorithms (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    topic_id        bigint      NOT NULL REFERENCES topics (id) ON DELETE RESTRICT,
    slug            text        NOT NULL,
    content_key     text        NOT NULL,
    name            text        NOT NULL,
    state_kind      text        NOT NULL,
    difficulty      text        NOT NULL CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    summary         text        NOT NULL DEFAULT '',
    time_complexity text        NOT NULL,
    space_complexity text       NOT NULL,
    learning_text   text        NOT NULL DEFAULT '',
    wave            smallint    NOT NULL DEFAULT 0 CHECK (wave >= 0),
    status          text        NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_algorithms_slug UNIQUE (slug),
    CONSTRAINT uq_algorithms_content_key UNIQUE (content_key),
    CONSTRAINT ck_algorithms_slug CHECK (slug ~ '^[a-z][a-z0-9-]*$')
);
CREATE INDEX ix_algorithms_topic ON algorithms (topic_id, sort_order);
CREATE TRIGGER trg_algorithms_updated BEFORE UPDATE ON algorithms FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE algorithm_languages (
    algorithm_id  bigint   NOT NULL REFERENCES algorithms (id) ON DELETE CASCADE,
    language_code text     NOT NULL REFERENCES programming_languages (code) ON DELETE RESTRICT,
    content_hash  char(64) NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
    PRIMARY KEY (algorithm_id, language_code)
);

CREATE TABLE algorithm_versions (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    algorithm_id bigint      NOT NULL REFERENCES algorithms (id) ON DELETE CASCADE,
    version      integer     NOT NULL CHECK (version >= 1),
    content_hash char(64)    NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
    published_at timestamptz NOT NULL DEFAULT now(),
    notes        text        NOT NULL DEFAULT '',
    CONSTRAINT uq_algorithm_versions UNIQUE (algorithm_id, version)
);
