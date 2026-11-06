UPDATE password_reset_tokens SET used_at = CAST(:at AS timestamptz) WHERE user_id = CAST(:userId AS uuid) AND used_at IS NULL;
