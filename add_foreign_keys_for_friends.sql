-- =====================================================
-- ДОДАВАННЯ FOREIGN KEY CONSTRAINTS
-- =====================================================
-- Цей скрипт додає foreign key constraints для таблиць
-- friends, blocked_users та private_messages
-- Це виправляє помилки PGRST200 "Could not find a relationship"
-- =====================================================

-- Спочатку перевіряємо, чи існує таблиця profiles
-- Якщо використовується auth.users, замініть на auth.users(id)

-- =====================================================
-- FRIENDS TABLE - Foreign Keys
-- =====================================================

-- Додаємо foreign key для user_id (посилання на auth.users)
DO $$
BEGIN
  -- Перевіряємо, чи вже існує constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'friends_user_id_fkey'
  ) THEN
    ALTER TABLE friends
    ADD CONSTRAINT friends_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: friends_user_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key friends_user_id_fkey already exists';
  END IF;
END $$;

-- Додаємо foreign key для friend_id (посилання на auth.users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'friends_friend_id_fkey'
  ) THEN
    ALTER TABLE friends
    ADD CONSTRAINT friends_friend_id_fkey
    FOREIGN KEY (friend_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: friends_friend_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key friends_friend_id_fkey already exists';
  END IF;
END $$;

-- =====================================================
-- BLOCKED_USERS TABLE - Foreign Keys
-- =====================================================

-- Додаємо foreign key для user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'blocked_users_user_id_fkey'
  ) THEN
    ALTER TABLE blocked_users
    ADD CONSTRAINT blocked_users_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: blocked_users_user_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key blocked_users_user_id_fkey already exists';
  END IF;
END $$;

-- Додаємо foreign key для blocked_user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'blocked_users_blocked_user_id_fkey'
  ) THEN
    ALTER TABLE blocked_users
    ADD CONSTRAINT blocked_users_blocked_user_id_fkey
    FOREIGN KEY (blocked_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: blocked_users_blocked_user_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key blocked_users_blocked_user_id_fkey already exists';
  END IF;
END $$;

-- =====================================================
-- PRIVATE_MESSAGES TABLE - Foreign Keys
-- =====================================================

-- Додаємо foreign key для sender_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'private_messages_sender_id_fkey'
  ) THEN
    ALTER TABLE private_messages
    ADD CONSTRAINT private_messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: private_messages_sender_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key private_messages_sender_id_fkey already exists';
  END IF;
END $$;

-- Додаємо foreign key для receiver_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'private_messages_receiver_id_fkey'
  ) THEN
    ALTER TABLE private_messages
    ADD CONSTRAINT private_messages_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: private_messages_receiver_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key private_messages_receiver_id_fkey already exists';
  END IF;
END $$;

-- =====================================================
-- ПЕРЕВІРКА
-- =====================================================
-- Після виконання перевірте в Supabase Dashboard:
-- Database → Tables → friends → Foreign Keys
-- Мають з'явитися зв'язки з auth.users
