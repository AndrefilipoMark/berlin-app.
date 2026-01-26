-- Додати user_id до forum_posts і forum_replies (власник, посилання на профіль)
-- Запустіть у Supabase SQL Editor.

ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS user_id UUID;
