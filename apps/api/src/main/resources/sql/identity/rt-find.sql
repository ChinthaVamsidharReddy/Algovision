SELECT id, user_id, family_id, token_hash, issued_at, expires_at, rotated_at, revoked_at, user_agent
FROM refresh_tokens WHERE token_hash = :tokenHash
