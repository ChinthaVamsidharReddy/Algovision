SELECT a.slug, a.name, a.state_kind, a.difficulty, a.summary, a.learning_text, a.time_complexity, a.space_complexity, a.wave,
       t.slug AS topic_slug, t.name AS topic_name, c.slug AS category_slug, c.name AS category_name,
       v.version AS content_version, v.content_hash AS content_hash
FROM algorithms a
JOIN topics t ON t.id = a.topic_id AND t.status = 'PUBLISHED'
JOIN categories c ON c.id = t.category_id AND c.status = 'PUBLISHED'
LEFT JOIN LATERAL (SELECT version, content_hash FROM algorithm_versions WHERE algorithm_id = a.id ORDER BY version DESC LIMIT 1) v ON true
WHERE a.slug = :slug AND a.status = 'PUBLISHED';
