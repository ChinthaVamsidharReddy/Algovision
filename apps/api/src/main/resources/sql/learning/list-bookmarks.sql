SELECT a.slug AS algorithm_slug, a.name, b.created_at
FROM bookmarks b JOIN algorithms a ON a.id = b.algorithm_id
WHERE b.user_id = CAST(:userId AS uuid) AND a.status = 'PUBLISHED'
ORDER BY b.created_at DESC, a.slug;
