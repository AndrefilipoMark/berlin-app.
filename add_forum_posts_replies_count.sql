-- Додати колонку replies_count до forum_posts (потрібно для тригера на forum_replies)
-- Запустіть у Supabase SQL Editor.

ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0;
