-- ============================================
-- Додати колонку district до таблиці profiles
-- та оновити тригер handle_new_user для збереження district при реєстрації
-- ============================================
-- Виконайте цей SQL у Supabase → SQL Editor → Run.
-- ============================================

-- 1. Додати колонку district, якщо її немає
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT;

-- 2. Оновити функцію handle_new_user: зберігати district з user metadata при реєстрації
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, district, gender)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'Користувач'),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'district'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'gender'), '')
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        RETURN NEW;
END;
$$;

-- ============================================
-- Готово. Після реєстрації district і gender зберігатимуться в профілі.
-- ============================================
