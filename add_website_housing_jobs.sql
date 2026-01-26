-- Додати колонку website до housing та jobs
-- Запустіть у Supabase SQL Editor.

ALTER TABLE housing ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS website VARCHAR(255);
