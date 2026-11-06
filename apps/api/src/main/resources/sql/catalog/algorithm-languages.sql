SELECT l.code, l.display_name, l.editor_id, al.content_hash
FROM algorithm_languages al
JOIN algorithms a ON a.id = al.algorithm_id
JOIN programming_languages l ON l.code = al.language_code AND l.enabled
WHERE a.slug = :slug AND a.status = 'PUBLISHED'
ORDER BY l.sort_order;
