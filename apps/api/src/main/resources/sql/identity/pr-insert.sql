INSERT INTO password_reset_tokens (id, user_id, token_hash, created_at, expires_at)
VALUES (CAST(:id AS uuid), CAST(:userId AS uuid), :tokenHash, CAST(:createdAt AS timestamptz), CAST(:expiresAt AS timestamptz));
