-- Behavioural checks for the Flyway schema. Run after applying V1..V6. Any failure raises an exception.
\set ON_ERROR_STOP on

CREATE FUNCTION pg_temp.must_fail(stmt text, expected_state text) RETURNS void AS $$
BEGIN
    BEGIN
        EXECUTE stmt;
    EXCEPTION WHEN OTHERS THEN
        IF SQLSTATE = expected_state THEN
            RETURN;
        END IF;
        RAISE EXCEPTION 'expected SQLSTATE % but got % (%) for: %', expected_state, SQLSTATE, SQLERRM, stmt;
    END;
    RAISE EXCEPTION 'expected failure (%) but statement succeeded: %', expected_state, stmt;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    expected text[] := ARRAY['users','roles','user_roles','refresh_tokens','password_reset_tokens','user_preferences',
        'programming_languages','categories','topics','topic_relations','algorithms','algorithm_languages','algorithm_versions',
        'practice_questions','question_options','quiz_attempts','user_progress','bookmarks','learning_activity','audit_logs'];
    actual text[];
BEGIN
    SELECT array_agg(table_name::text ORDER BY table_name) INTO actual
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'flyway_schema_history';
    IF actual IS DISTINCT FROM (SELECT array_agg(t ORDER BY t) FROM unnest(expected) t) THEN
        RAISE EXCEPTION 'table set mismatch: %', actual;
    END IF;
    IF cardinality(actual) <> 20 THEN RAISE EXCEPTION 'expected 20 tables, found %', cardinality(actual); END IF;
END $$;

-- Roles: student and admin only; the instructor role must not exist in MVP 1.
DO $$
BEGIN
    IF (SELECT array_agg(name ORDER BY name) FROM roles) IS DISTINCT FROM ARRAY['ROLE_ADMIN','ROLE_STUDENT'] THEN
        RAISE EXCEPTION 'unexpected roles: %', (SELECT array_agg(name) FROM roles);
    END IF;
END $$;

-- Languages seeded for all four supported languages.
DO $$
BEGIN
    IF (SELECT array_agg(code ORDER BY sort_order) FROM programming_languages) IS DISTINCT FROM ARRAY['java','python','cpp','c'] THEN
        RAISE EXCEPTION 'language seed mismatch';
    END IF;
END $$;

-- Users: email is case-insensitively unique and shape-checked; status is constrained.
INSERT INTO users (email, password_hash, full_name) VALUES ('Ada@Example.com', 'x', 'Ada');
SELECT pg_temp.must_fail($$INSERT INTO users (email, password_hash, full_name) VALUES ('ada@example.COM', 'x', 'Dup')$$, '23505');
SELECT pg_temp.must_fail($$INSERT INTO users (email, password_hash, full_name) VALUES ('not-an-email', 'x', 'Bad')$$, '23514');
SELECT pg_temp.must_fail($$INSERT INTO users (email, password_hash, full_name, status) VALUES ('b@example.com', 'x', 'B', 'WEIRD')$$, '23514');
SELECT pg_temp.must_fail($$INSERT INTO users (email, password_hash, full_name) VALUES ('c@example.com', 'x', '   ')$$, '23514');

-- updated_at trigger moves forward on update.
DO $$
DECLARE before_ts timestamptz; after_ts timestamptz;
BEGIN
    SELECT updated_at INTO before_ts FROM users WHERE email = 'ada@example.com';
    PERFORM pg_sleep(0.01);
    UPDATE users SET full_name = 'Ada L' WHERE email = 'ada@example.com';
    SELECT updated_at INTO after_ts FROM users WHERE email = 'ada@example.com';
    IF after_ts <= before_ts THEN RAISE EXCEPTION 'updated_at did not advance'; END IF;
END $$;

-- A role that does not exist cannot be granted (instructor is not assignable).
SELECT pg_temp.must_fail($$INSERT INTO user_roles (user_id, role_id) SELECT id, 99 FROM users LIMIT 1$$, '23503');
SELECT pg_temp.must_fail($$INSERT INTO roles (name) VALUES ('instructor')$$, '23514');

-- Tokens must be stored as 64-char lowercase hex digests (never raw tokens) and be unique.
INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
SELECT id, gen_random_uuid(), repeat('a', 64), now() + interval '14 days' FROM users LIMIT 1;
SELECT pg_temp.must_fail($$INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at) SELECT id, gen_random_uuid(), repeat('a', 64), now() + interval '1 day' FROM users LIMIT 1$$, '23505');
SELECT pg_temp.must_fail($$INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at) SELECT id, gen_random_uuid(), 'raw-token-value', now() + interval '1 day' FROM users LIMIT 1$$, '23514');
SELECT pg_temp.must_fail($$INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at) SELECT id, gen_random_uuid(), repeat('b', 64), now() - interval '1 day' FROM users LIMIT 1$$, '23514');

-- Catalog: self-relation rejected, one correct option per question, slug shape.
INSERT INTO topics (category_id, slug, name, difficulty) SELECT id, 'second-topic', 'Second', 'BEGINNER' FROM categories LIMIT 1;
SELECT pg_temp.must_fail($$INSERT INTO topic_relations SELECT id, id, 'RELATED' FROM topics LIMIT 1$$, '23514');
SELECT pg_temp.must_fail($$INSERT INTO categories (slug, name) VALUES ('Bad Slug', 'x')$$, '23514');
INSERT INTO practice_questions (topic_id, prompt) SELECT id, 'What does head point to?' FROM topics WHERE slug = 'linked-list-basics';
INSERT INTO question_options (question_id, label, is_correct) SELECT id, 'The first node', true FROM practice_questions;
INSERT INTO question_options (question_id, label, is_correct) SELECT id, 'The last node', false FROM practice_questions;
SELECT pg_temp.must_fail($$INSERT INTO question_options (question_id, label, is_correct) SELECT id, 'Also correct', true FROM practice_questions$$, '23505');

-- Catalog rows with dependants cannot be deleted (archive instead).
SELECT pg_temp.must_fail($$DELETE FROM topics WHERE slug = 'linked-list-basics'$$, '23503');

-- Progress: completed_at must agree with status; cascade removes user-owned rows with the user.
INSERT INTO user_progress (user_id, algorithm_id) SELECT u.id, a.id FROM users u, algorithms a LIMIT 1;
SELECT pg_temp.must_fail($$UPDATE user_progress SET status = 'COMPLETED'$$, '23514');
UPDATE user_progress SET status = 'COMPLETED', completed_at = now();
INSERT INTO bookmarks (user_id, algorithm_id) SELECT u.id, a.id FROM users u, algorithms a LIMIT 1;
SELECT pg_temp.must_fail($$INSERT INTO bookmarks (user_id, algorithm_id) SELECT u.id, a.id FROM users u, algorithms a LIMIT 1$$, '23505');
INSERT INTO user_preferences (user_id, language_code, playback_speed) SELECT id, 'python', 1.5 FROM users LIMIT 1;
SELECT pg_temp.must_fail($$UPDATE user_preferences SET playback_speed = 3.0$$, '23514');
INSERT INTO learning_activity (user_id, event_type, algorithm_id) SELECT u.id, 'VIEWED', a.id FROM users u, algorithms a LIMIT 1;

-- Audit log is append-only, and survives deletion of the actor (no FK).
INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) SELECT id, 'PUBLISH', 'algorithm', 'x' FROM users LIMIT 1;
SELECT pg_temp.must_fail($$UPDATE audit_logs SET action = 'TAMPER'$$, 'P0001');
SELECT pg_temp.must_fail($$DELETE FROM audit_logs$$, 'P0001');

DELETE FROM users;
DO $$
BEGIN
    IF (SELECT count(*) FROM user_progress) + (SELECT count(*) FROM bookmarks) + (SELECT count(*) FROM refresh_tokens)
       + (SELECT count(*) FROM user_preferences) + (SELECT count(*) FROM learning_activity) <> 0 THEN
        RAISE EXCEPTION 'user-owned rows did not cascade';
    END IF;
    IF (SELECT count(*) FROM audit_logs) <> 1 THEN RAISE EXCEPTION 'audit row should survive user deletion'; END IF;
END $$;

SELECT 'schema verification passed' AS result;
