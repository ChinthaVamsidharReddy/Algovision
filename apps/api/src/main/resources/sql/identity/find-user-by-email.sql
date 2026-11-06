SELECT id, email::text AS email, password_hash, full_name, status FROM users WHERE email = :email
