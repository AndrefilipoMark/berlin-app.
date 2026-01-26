-- =====================================================
-- ENABLE REALTIME FOR PRIVATE_MESSAGES TABLE
-- =====================================================

-- Увімкнути Realtime для таблиці private_messages
-- Це потрібно зробити в Supabase Dashboard або через SQL

-- Варіант 1: Через Supabase Dashboard
-- 1. Відкрийте Supabase Dashboard
-- 2. Перейдіть до Database → Replication
-- 3. Знайдіть таблицю "private_messages"
-- 4. Увімкніть Realtime для цієї таблиці

-- Варіант 2: Через SQL (якщо є доступ до бази)
-- ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;

-- Перевірка: після виконання перевірте в Dashboard, що таблиця з'явилася в Replication
