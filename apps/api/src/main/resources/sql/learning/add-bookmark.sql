INSERT INTO bookmarks (user_id, algorithm_id)
SELECT CAST(:userId AS uuid), a.id FROM algorithms a WHERE a.slug = :slug AND a.status = 'PUBLISHED'
ON CONFLICT (user_id, algorithm_id) DO NOTHING
RETURNING algorithm_id;
