UPDATE refresh_tokens SET revoked_at = :at WHERE family_id = :familyId AND revoked_at IS NULL
