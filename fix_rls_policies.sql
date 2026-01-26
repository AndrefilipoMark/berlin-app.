-- =====================================================
-- Оновлені RLS Політики - Публічний доступ
-- =====================================================
-- Цей скрипт дозволяє будь-якому користувачу (без автентифікації)
-- додавати вакансії, житло, сервіси та пости на форумі
-- =====================================================

-- Спочатку видаляємо старі політики INSERT, які вимагають автентифікації
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can insert housing" ON housing;
DROP POLICY IF EXISTS "Authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Authenticated users can insert forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Authenticated users can insert forum replies" ON forum_replies;

-- Створюємо нові політики, які дозволяють публічний доступ для INSERT

-- JOBS - Будь-хто може додавати вакансії
CREATE POLICY "Anyone can insert jobs" ON jobs
  FOR INSERT WITH CHECK (true);

-- HOUSING - Будь-хто може додавати житло
CREATE POLICY "Anyone can insert housing" ON housing
  FOR INSERT WITH CHECK (true);

-- SERVICES - Будь-хто може додавати сервіси
CREATE POLICY "Anyone can insert services" ON services
  FOR INSERT WITH CHECK (true);

-- FORUM POSTS - Будь-хто може додавати пости
CREATE POLICY "Anyone can insert forum posts" ON forum_posts
  FOR INSERT WITH CHECK (true);

-- FORUM REPLIES - Будь-хто може додавати відповіді
CREATE POLICY "Anyone can insert forum replies" ON forum_replies
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- ОПЦІОНАЛЬНО: Оновити UPDATE/DELETE політики
-- =====================================================
-- Якщо ви хочете, щоб користувачі могли редагувати/видаляти
-- записи без автентифікації (НЕ РЕКОМЕНДУЄТЬСЯ для production),
-- розкоментуйте наступні рядки:

-- DROP POLICY IF EXISTS "Users can update their own jobs" ON jobs;
-- DROP POLICY IF EXISTS "Users can delete their own jobs" ON jobs;
-- DROP POLICY IF EXISTS "Users can update their own housing" ON housing;
-- DROP POLICY IF EXISTS "Users can delete their own housing" ON housing;

-- CREATE POLICY "Anyone can update jobs" ON jobs FOR UPDATE USING (true);
-- CREATE POLICY "Anyone can delete jobs" ON jobs FOR DELETE USING (true);
-- CREATE POLICY "Anyone can update housing" ON housing FOR UPDATE USING (true);
-- CREATE POLICY "Anyone can delete housing" ON housing FOR DELETE USING (true);

-- =====================================================
-- ГОТОВО!
-- =====================================================
-- Тепер будь-який користувач може додавати контент без реєстрації
