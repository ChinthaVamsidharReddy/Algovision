INSERT INTO user_progress (user_id, algorithm_id, status, last_language_code, first_viewed_at, last_viewed_at, completed_at)
SELECT CAST(:userId AS uuid), a.id, 'COMPLETED', NULLIF(:language, ''), CAST(:at AS timestamptz), CAST(:at AS timestamptz), CAST(:at AS timestamptz)
FROM algorithms a WHERE a.slug = :slug AND a.status = 'PUBLISHED'
ON CONFLICT (user_id, algorithm_id) DO UPDATE
   SET status = 'COMPLETED',
       completed_at = COALESCE(user_progress.completed_at, EXCLUDED.completed_at),
       last_viewed_at = GREATEST(user_progress.last_viewed_at, EXCLUDED.last_viewed_at),
       last_language_code = COALESCE(EXCLUDED.last_language_code, user_progress.last_language_code)
RETURNING algorithm_id;
