-- =====================================================
-- ВИПРАВЛЕННЯ RLS ПОЛІТИК ДЛЯ ТАБЛИЦІ FRIENDS
-- =====================================================
-- Цей скрипт виправляє проблеми з отриманням списку друзів
-- =====================================================

-- Спочатку перевіряємо, чи існує політика
DO $$
BEGIN
  -- Видаляємо стару політику, якщо вона існує
  DROP POLICY IF EXISTS "Users can view their own friend requests" ON friends;
  
  -- Створюємо нову політику, яка точно працює
  CREATE POLICY "Users can view their own friend requests" ON friends
    FOR SELECT USING (
      auth.uid() = user_id OR auth.uid() = friend_id
    );
  
  RAISE NOTICE 'Policy "Users can view their own friend requests" created/updated';
END $$;

-- Перевіряємо, чи RLS увімкнено
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Створюємо індекси для швидшого пошуку (якщо їх ще немає)
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_friend_status ON friends(user_id, friend_id, status);

-- Коментарі для таблиці
COMMENT ON TABLE friends IS 'Таблиця друзів та запитів на дружбу';
COMMENT ON COLUMN friends.status IS 'Статус: pending - очікує підтвердження, accepted - прийнято, rejected - відхилено';

-- =====================================================
-- ПЕРЕВІРКА: Перевіряємо, чи працює політика
-- =====================================================
-- Виконайте цей запит в SQL Editor Supabase, щоб перевірити:
-- SELECT * FROM friends WHERE status = 'accepted';
-- Має повернути записи, де ви є user_id або friend_id
