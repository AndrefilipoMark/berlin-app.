-- =====================================================
-- Виправлення RLS політик для оновлення житла
-- =====================================================
-- Цей скрипт дозволяє оновлювати житло навіть без авторизації
-- або якщо user_id NULL
-- =====================================================

-- Видалити старі політики UPDATE для housing
DROP POLICY IF EXISTS "Users can update their own housing" ON housing;

-- Створити нову політику, яка дозволяє оновлення будь-кому
-- (для production можна додати перевірку прав)
CREATE POLICY "Anyone can update housing" ON housing
  FOR UPDATE USING (true);

-- Також видалити та перестворити політику DELETE
DROP POLICY IF EXISTS "Users can delete their own housing" ON housing;

CREATE POLICY "Anyone can delete housing" ON housing
  FOR DELETE USING (true);

-- =====================================================
-- ГОТОВО!
-- =====================================================
-- Тепер будь-хто може оновлювати та видаляти житло
-- Для production рекомендується додати перевірку прав
