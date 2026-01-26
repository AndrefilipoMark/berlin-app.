-- =====================================================
-- Дозволити NULL для user_id
-- =====================================================
-- Цей скрипт змінює колонки user_id, щоб вони могли бути порожніми
-- Це необхідно для додавання контенту без автентифікації
-- =====================================================

-- Дозволити NULL для всіх таблиць
ALTER TABLE jobs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE housing ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE services ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE forum_posts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE forum_replies ALTER COLUMN user_id DROP NOT NULL;

-- Перевірка: показати структуру колонок
SELECT 
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'user_id'
ORDER BY table_name;

-- =====================================================
-- ГОТОВО!
-- =====================================================
-- Тепер user_id може бути порожнім (NULL)
