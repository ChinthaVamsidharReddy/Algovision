-- Starter catalog rows for the first visualization. The algorithm stays DRAFT until the content sync
-- (a later milestone) records real content hashes for each language; no placeholder hashes are stored.
INSERT INTO categories (slug, name, description, status, sort_order)
VALUES ('linked-lists', 'Linked Lists', 'Nodes connected by pointers.', 'PUBLISHED', 10);

INSERT INTO topics (category_id, slug, name, difficulty, summary, objectives, status, sort_order)
SELECT id, 'linked-list-basics', 'Linked List Basics', 'BEGINNER',
       'How a singly linked list stores values and how its head pointer works.',
       ARRAY['Explain what a node and a head pointer are', 'Insert a node at the front in O(1)'],
       'PUBLISHED', 10
FROM categories WHERE slug = 'linked-lists';

INSERT INTO algorithms (topic_id, slug, content_key, name, state_kind, difficulty, summary,
                        time_complexity, space_complexity, wave, status, sort_order)
SELECT id, 'linked-list-insert-head', 'linked-list-insert-head', 'Linked List: Insert at Beginning', 'linkedList', 'BEGINNER',
       'Add a new node at the front of a singly linked list in constant time by re-pointing the head.',
       'O(1)', 'O(1)', 0, 'DRAFT', 10
FROM topics WHERE slug = 'linked-list-basics';
