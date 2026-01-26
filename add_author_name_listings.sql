-- Додати author_name до jobs, housing, services для відображення автора на картках
-- Запустіть у Supabase SQL Editor.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE housing ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE services ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
