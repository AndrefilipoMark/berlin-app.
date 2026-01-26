-- Додати last_seen для підрахунку онлайну (активні за останні хв)
-- Запустіть у Supabase SQL Editor.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
