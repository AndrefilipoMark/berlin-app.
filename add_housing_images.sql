-- Додати колонку images до housing для фото оголошень
-- Запустіть у Supabase: SQL Editor → New query → вставте цей код → Run.

ALTER TABLE housing
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN housing.images IS 'Масив URL фото (з Storage bucket housing-photos)';
