INSERT INTO learning_activity (user_id, event_type, algorithm_id, occurred_at, metadata)
SELECT CAST(:userId AS uuid), :eventType, a.id, CAST(:at AS timestamptz), '{}'::jsonb
FROM algorithms a WHERE a.slug = :slug
RETURNING id;
