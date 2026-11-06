INSERT INTO refresh_tokens (id, user_id, family_id, token_hash, issued_at, expires_at, user_agent)
VALUES (:id, :userId, :familyId, :tokenHash, :issuedAt, :expiresAt, :userAgent)
