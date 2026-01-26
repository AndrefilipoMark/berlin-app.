-- =====================================================
-- Виправлення таблиці services - додавання user_id колонки
-- =====================================================
-- Цей скрипт додає колонку user_id до таблиці services,
-- якщо вона відсутня, та налаштовує правильні RLS політики
-- =====================================================

-- Додати колонку user_id, якщо вона не існує
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE services ADD COLUMN user_id UUID;
    RAISE NOTICE 'Колонка user_id додана до таблиці services';
  ELSE
    RAISE NOTICE 'Колонка user_id вже існує в таблиці services';
  END IF;
END $$;

-- Дозволити NULL для user_id (щоб можна було додавати без авторизації)
ALTER TABLE services ALTER COLUMN user_id DROP NOT NULL;

-- Видалити старі політики INSERT, якщо вони існують
DROP POLICY IF EXISTS "Authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Anyone can insert services" ON services;

-- Створити нову політику, яка дозволяє публічний доступ для INSERT
CREATE POLICY "Anyone can insert services" ON services
  FOR INSERT WITH CHECK (true);

-- Перевірка: показати структуру колонок
SELECT 
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'services'
  AND column_name = 'user_id';

-- =====================================================
-- ГОТОВО!
-- =====================================================
-- Тепер таблиця services має колонку user_id (опціональну)
-- і будь-хто може додавати сервіси
