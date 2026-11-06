DELETE FROM bookmarks b USING algorithms a
WHERE a.id = b.algorithm_id AND a.slug = :slug AND b.user_id = CAST(:userId AS uuid)
RETURNING b.algorithm_id;
