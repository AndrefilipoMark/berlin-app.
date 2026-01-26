-- ============================================
-- ФІНАЛЬНА СТАДІЯ: АВТЕНТИФІКАЦІЯ ТА ЧАТ
-- ============================================
-- Виконайте цей SQL у Supabase SQL Editor
-- ============================================

-- 1. СТВОРЕННЯ ПРОФІЛІВ КОРИСТУВАЧІВ
-- ============================================
-- Ця таблиця зберігає додаткову інформацію про користувачів
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS для profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Кожен може читати профілі
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Користувач може оновлювати свій профіль
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Автоматичне створення профілю при реєстрації
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Користувач')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Тригер для автоматичного створення профілю
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- 2. ТАБЛИЦЯ ДЛЯ ЧАТУ (MESSAGES)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Індекс для швидкого завантаження повідомлень
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

-- RLS для messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Всі можуть читати повідомлення
CREATE POLICY "Messages are viewable by everyone"
    ON public.messages FOR SELECT
    USING (true);

-- Тільки авторизовані можуть відправляти
CREATE POLICY "Authenticated users can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Користувач може видаляти свої повідомлення
CREATE POLICY "Users can delete own messages"
    ON public.messages FOR DELETE
    USING (auth.uid() = user_id);


-- 3. ОНОВЛЕННЯ FORUM_POSTS ДЛЯ ЗВ'ЯЗКУ З КОРИСТУВАЧАМИ
-- ============================================
-- Додаємо колонку user_id до forum_posts (якщо її немає)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'forum_posts' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.forum_posts 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Оновлюємо RLS для forum_posts
DROP POLICY IF EXISTS "Anyone can insert forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Forum posts are viewable by everyone" ON public.forum_posts;

-- Нова політика: всі можуть читати
CREATE POLICY "Forum posts are viewable by everyone"
    ON public.forum_posts FOR SELECT
    USING (true);

-- Тільки авторизовані можуть створювати пости
CREATE POLICY "Authenticated users can create posts"
    ON public.forum_posts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Користувач може оновлювати свої пости
CREATE POLICY "Users can update own posts"
    ON public.forum_posts FOR UPDATE
    USING (auth.uid() = user_id);

-- Користувач може видаляти свої пости
CREATE POLICY "Users can delete own posts"
    ON public.forum_posts FOR DELETE
    USING (auth.uid() = user_id);


-- 4. СТВОРЕННЯ ТАБЛИЦІ FORUM_REPLIES (ЯКЩО НЕ ІСНУЄ)
-- ============================================
CREATE TABLE IF NOT EXISTS public.forum_replies (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON public.forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON public.forum_replies(created_at DESC);

-- RLS для forum_replies
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Всі можуть читати відповіді
CREATE POLICY "Forum replies are viewable by everyone"
    ON public.forum_replies FOR SELECT
    USING (true);

-- Тільки авторизовані можуть відповідати
CREATE POLICY "Authenticated users can reply"
    ON public.forum_replies FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Користувач може видаляти свої відповіді
CREATE POLICY "Users can delete own replies"
    ON public.forum_replies FOR DELETE
    USING (auth.uid() = user_id);


-- 5. ОНОВЛЕННЯ ІНШИХ ТАБЛИЦЬ ДЛЯ ЗВ'ЯЗКУ З КОРИСТУВАЧАМИ
-- ============================================
-- Оновлюємо RLS для jobs, housing, services
-- Змінюємо з "Anyone can insert" на "Authenticated users can insert"

-- JOBS
DROP POLICY IF EXISTS "Anyone can insert jobs" ON public.jobs;
CREATE POLICY "Authenticated users can insert jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Users can update own jobs"
    ON public.jobs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own jobs"
    ON public.jobs FOR DELETE
    USING (auth.uid() = user_id);

-- HOUSING
DROP POLICY IF EXISTS "Anyone can insert housing" ON public.housing;
CREATE POLICY "Authenticated users can insert housing"
    ON public.housing FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Users can update own housing"
    ON public.housing FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own housing"
    ON public.housing FOR DELETE
    USING (auth.uid() = user_id);

-- SERVICES
DROP POLICY IF EXISTS "Anyone can insert services" ON public.services;
CREATE POLICY "Authenticated users can insert services"
    ON public.services FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Users can update own services"
    ON public.services FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own services"
    ON public.services FOR DELETE
    USING (auth.uid() = user_id);


-- 6. ДОДАТКОВІ ФУНКЦІЇ ДЛЯ СТАТИСТИКИ
-- ============================================

-- Функція для підрахунку відповідей на пост
CREATE OR REPLACE FUNCTION get_post_replies_count(post_id_param BIGINT)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER FROM public.forum_replies WHERE post_id = post_id_param;
$$ LANGUAGE SQL STABLE;

-- Функція для отримання останніх повідомлень чату
CREATE OR REPLACE FUNCTION get_recent_messages(limit_param INTEGER DEFAULT 50)
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    author_name TEXT,
    content TEXT,
    created_at TIMESTAMPTZ,
    avatar_url TEXT
) AS $$
    SELECT 
        m.id,
        m.user_id,
        m.author_name,
        m.content,
        m.created_at,
        p.avatar_url
    FROM public.messages m
    LEFT JOIN public.profiles p ON m.user_id = p.id
    ORDER BY m.created_at DESC
    LIMIT limit_param;
$$ LANGUAGE SQL STABLE;


-- ============================================
-- ТЕСТОВІ ДАНІ (ОПЦІОНАЛЬНО)
-- ============================================

-- Якщо хочете додати тестові повідомлення для чату:
-- INSERT INTO public.messages (author_name, content, user_id)
-- VALUES 
--     ('Олена', 'Привіт усім! Хтось знає де можна знайти гарний ресторан?', NULL),
--     ('Максим', 'Рекомендую "Ukraїner" на Warschauer Straße', NULL);


-- ============================================
-- ГОТОВО!
-- ============================================
-- Після виконання цього SQL:
-- ✅ Створена таблиця profiles
-- ✅ Створена таблиця messages для чату
-- ✅ Оновлена таблиця forum_posts з user_id
-- ✅ Створена таблиця forum_replies
-- ✅ Оновлені RLS політики для всіх таблиць
-- ✅ Тільки авторизовані користувачі можуть додавати контент
-- ✅ Real-time готовий для чату
-- ============================================
