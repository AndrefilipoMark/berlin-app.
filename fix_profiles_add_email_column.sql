-- ============================================
-- Додати колонку email (та інші) до profiles
-- ============================================
-- Помилка: "Could not find the 'email' column of 'profiles'".
-- Виконайте цей SQL у Supabase → SQL Editor → Run.
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================
-- Готово. Після виконання перезавантажте сторінку додатку.
-- ============================================
