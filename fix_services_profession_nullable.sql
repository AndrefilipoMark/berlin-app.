-- =====================================================
-- Зробити profession nullable в таблиці services
-- =====================================================
-- Оскільки поле "Професія" прибрано з форми,
-- потрібно зробити його опціональним в базі даних
-- =====================================================

-- Зробити profession nullable
ALTER TABLE services ALTER COLUMN profession DROP NOT NULL;

-- Оновити існуючі записи, де profession порожній
UPDATE services SET profession = NULL WHERE profession = '';

-- Перевірка
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'services'
  AND column_name = 'profession';

-- =====================================================
-- ГОТОВО!
-- =====================================================
