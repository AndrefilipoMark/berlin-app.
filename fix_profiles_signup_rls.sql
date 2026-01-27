-- ============================================
-- ВИПРАВЛЕННЯ: "Database error saving new user" при реєстрації
-- ============================================
-- Причина: RLS увімкнено на profiles, але немає політики INSERT.
-- Тригер handle_new_user не може вставити рядок у profiles → signup повертає 500.
--
-- Інструкція:
-- 1. Відкрийте Supabase Dashboard → SQL Editor.
-- 2. Вставте цей скрипт і натисніть Run.
-- 3. Якщо зʼявиться "role supabase_admin does not exist" — видаліть блок 1a-alt (рядки 24–28).
-- 4. Якщо "ALTER FUNCTION ... OWNER" впаде — закоментуйте крок 3 (рядок 66).
-- 5. Спробуйте реєстрацію знову.
-- ============================================

-- 1. Політики INSERT для profiles
-- --------------------------------------------------------------------------
-- 1a. Дозволити тригеру (він виконується як postgres) вставляти профіль при реєстрації.
--     Під час signup auth.uid() ще NULL, тому політика "auth.uid() = id" не спрацьовує.
DROP POLICY IF EXISTS "Allow postgres to insert profiles for trigger" ON public.profiles;
CREATE POLICY "Allow postgres to insert profiles for trigger"
    ON public.profiles FOR INSERT
    TO postgres
    WITH CHECK (true);

-- 1a-alt. І для supabase_admin (деякі проекти використовують цю роль для тригерів).
DROP POLICY IF EXISTS "Allow supabase_admin to insert profiles for trigger" ON public.profiles;
CREATE POLICY "Allow supabase_admin to insert profiles for trigger"
    ON public.profiles FOR INSERT
    TO supabase_admin
    WITH CHECK (true);

-- 1b. Користувач може вставити лише свій профіль (якщо клієнт колись робитиме INSERT).
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 2. Оновлення функції handle_new_user (search_path + надійність)
-- --------------------------------------------------------------------------
-- search_path = '' згідно з офіційною документацією Supabase.
-- Зберігаємо full_name, email, gender з raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, gender)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'Користувач'),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'gender'), '')
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- профіль вже існує (наприклад, повторний signup) — ігноруємо
        RETURN NEW;
END;
$$;

-- 3. Власник функції = postgres (щоб тригер виконувався як postgres і пройшла політика 1a)
-- --------------------------------------------------------------------------
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 4. Перестворення тригера
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Готово. Спробуйте реєстрацію знову.
-- Якщо помилка лишається: Dashboard → Logs → Postgres — подивіться точний текст помилки.
-- ============================================
