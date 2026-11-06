INSERT INTO user_preferences (user_id, language_code, theme, playback_speed)
VALUES (CAST(:userId AS uuid), NULLIF(:language, ''), :theme, CAST(:speed AS numeric))
ON CONFLICT (user_id) DO UPDATE
   SET language_code = EXCLUDED.language_code, theme = EXCLUDED.theme, playback_speed = EXCLUDED.playback_speed
RETURNING user_id;
