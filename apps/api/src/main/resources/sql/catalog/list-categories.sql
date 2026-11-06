SELECT c.slug, c.name, c.description,
       (SELECT count(*) FROM algorithms a JOIN topics t ON t.id = a.topic_id
         WHERE t.category_id = c.id AND a.status = 'PUBLISHED' AND t.status = 'PUBLISHED') AS algorithm_count
FROM categories c
WHERE c.status = 'PUBLISHED'
ORDER BY c.sort_order, c.slug;
