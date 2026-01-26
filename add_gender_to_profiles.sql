-- Додати колонку gender до таблиці profiles
-- Значення: 'male' (чоловік), 'female' (жінка) або NULL (не вказано)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- Оновлюємо функцію створення профілю при реєстрації: зберігаємо gender з user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, gender)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Користувач'),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'gender'), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
