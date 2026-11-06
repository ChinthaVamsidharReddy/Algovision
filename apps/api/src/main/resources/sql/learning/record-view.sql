INSERT INTO user_progress (user_id, algorithm_id, status, last_language_code, first_viewed_at, last_viewed_at)
SELECT CAST(:userId AS uuid), a.id, 'IN_PROGRESS', NULLIF(:language, ''), CAST(:at AS timestamptz), CAST(:at AS timestamptz)
FROM algorithms a WHERE a.slug = :slug AND a.status = 'PUBLISHED'
ON CONFLICT (user_id, algorithm_id) DO UPDATE
   SET last_viewed_at = GREATEST(user_progress.last_viewed_at, EXCLUDED.last_viewed_at),
       last_language_code = COALESCE(EXCLUDED.last_language_code, user_progress.last_language_code)
RETURNING algorithm_id;
