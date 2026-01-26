-- =====================================================
-- Повне виправлення таблиці services
-- =====================================================
-- Цей скрипт:
-- 1. Додає колонку user_id до таблиці services (якщо відсутня)
-- 2. Налаштовує RLS політики для INSERT, UPDATE, DELETE
-- =====================================================

-- =====================================================
-- КРОК 1: Додати колонку user_id
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

-- =====================================================
-- КРОК 2: Налаштувати RLS політики для INSERT
-- =====================================================

-- Видалити старі політики INSERT, якщо вони існують
DROP POLICY IF EXISTS "Authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Anyone can insert services" ON services;

-- Створити нову політику, яка дозволяє публічний доступ для INSERT
CREATE POLICY "Anyone can insert services" ON services
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- КРОК 3: Налаштувати RLS політики для UPDATE
-- =====================================================

-- Видалити старі політики UPDATE для services
DROP POLICY IF EXISTS "Users can update their own services" ON services;
DROP POLICY IF EXISTS "Anyone can update services" ON services;

-- Створити нову політику, яка дозволяє оновлення будь-кому
CREATE POLICY "Anyone can update services" ON services
  FOR UPDATE USING (true);

-- =====================================================
-- КРОК 4: Налаштувати RLS політики для DELETE
-- =====================================================

-- Видалити старі політики DELETE
DROP POLICY IF EXISTS "Users can delete their own services" ON services;
DROP POLICY IF EXISTS "Anyone can delete services" ON services;

-- Створити нову політику, яка дозволяє видалення будь-кому
CREATE POLICY "Anyone can delete services" ON services
  FOR DELETE USING (true);

-- =====================================================
-- Перевірка: показати структуру колонок
-- =====================================================
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
-- Тепер таблиця services:
-- ✅ Має колонку user_id (опціональну)
-- ✅ Будь-хто може додавати сервіси (INSERT)
-- ✅ Будь-хто може оновлювати сервіси (UPDATE)
-- ✅ Будь-хто може видаляти сервіси (DELETE)
-- 
-- Для production рекомендується додати перевірку прав
