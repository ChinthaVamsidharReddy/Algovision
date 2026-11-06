WITH u AS (
    INSERT INTO users (email, password_hash, full_name) VALUES (:email, :hash, :name) RETURNING id
)
INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM u, roles r WHERE r.name = 'ROLE_STUDENT' RETURNING user_id
