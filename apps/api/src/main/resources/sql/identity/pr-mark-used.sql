UPDATE password_reset_tokens SET used_at = CAST(:at AS timestamptz)
WHERE id = CAST(:id AS uuid) AND used_at IS NULL AND expires_at > CAST(:at AS timestamptz);
