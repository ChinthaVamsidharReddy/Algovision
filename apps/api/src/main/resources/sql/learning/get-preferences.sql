SELECT language_code, theme, playback_speed FROM user_preferences WHERE user_id = CAST(:userId AS uuid);
