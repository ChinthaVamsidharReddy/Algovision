SELECT a.slug AS algorithm_slug, p.status, p.last_language_code, p.first_viewed_at, p.last_viewed_at, p.completed_at
FROM user_progress p JOIN algorithms a ON a.id = p.algorithm_id
WHERE p.user_id = CAST(:userId AS uuid)
ORDER BY p.last_viewed_at DESC, a.slug;
