SELECT id, user_id, token_hash, created_at, expires_at, used_at FROM password_reset_tokens WHERE token_hash = :tokenHash;
