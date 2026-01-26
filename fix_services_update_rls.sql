-- =====================================================
-- Виправлення RLS політик для оновлення сервісів
-- =====================================================
-- Цей скрипт дозволяє оновлювати сервіси навіть без авторизації
-- або якщо user_id NULL
-- =====================================================

-- Видалити старі політики UPDATE для services
DROP POLICY IF EXISTS "Users can update their own services" ON services;

-- Створити нову політику, яка дозволяє оновлення будь-кому
CREATE POLICY "Anyone can update services" ON services
  FOR UPDATE USING (true);

-- Також видалити та перестворити політику DELETE
DROP POLICY IF EXISTS "Users can delete their own services" ON services;

CREATE POLICY "Anyone can delete services" ON services
  FOR DELETE USING (true);

-- =====================================================
-- ГОТОВО!
-- =====================================================
-- Тепер будь-хто може оновлювати та видаляти сервіси
-- Для production рекомендується додати перевірку прав
