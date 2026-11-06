UPDATE refresh_tokens SET revoked_at = :at WHERE user_id = :userId AND revoked_at IS NULL
