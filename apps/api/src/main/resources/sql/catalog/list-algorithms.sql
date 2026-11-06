SELECT a.slug, a.name, a.state_kind, a.difficulty, a.summary, a.time_complexity, a.space_complexity, a.wave,
       t.slug AS topic_slug, t.name AS topic_name, c.slug AS category_slug, c.name AS category_name
FROM algorithms a
JOIN topics t ON t.id = a.topic_id AND t.status = 'PUBLISHED'
JOIN categories c ON c.id = t.category_id AND c.status = 'PUBLISHED'
WHERE a.status = 'PUBLISHED'
ORDER BY c.sort_order, t.sort_order, a.sort_order, a.slug;
