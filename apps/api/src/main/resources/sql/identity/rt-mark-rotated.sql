UPDATE refresh_tokens SET rotated_at = :at WHERE id = :id AND rotated_at IS NULL AND revoked_at IS NULL
