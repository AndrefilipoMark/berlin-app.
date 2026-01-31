# 📸 Фото житла — налаштування Storage

## Крок 0: Колонка `images` у таблиці `housing`

Якщо при збереженні фото з’являється помилка **"Could not find the 'images' column of 'housing'"**, у базі ще немає колонки для URL фото.

1. Відкрийте [Supabase](https://supabase.com/dashboard) → ваш проект → **SQL Editor**
2. Натисніть **New query**
3. Вставте й виконайте (`Run`) скрипт з файлу **`add_housing_images.sql`** у корені проєкту:
   ```sql
   ALTER TABLE housing ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
   COMMENT ON COLUMN housing.images IS 'Масив URL фото (з Storage bucket housing-photos)';
   ```
4. Після успішного виконання переходьте до Storage (крок 1).

## Крок 1: Створити bucket у Supabase

1. Відкрийте проект у [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдіть у **Storage** (ліва панель)
3. Натисніть **"New bucket"**
4. Назва: `housing-photos`
5. Увімкніть **Public bucket** (публічний доступ до зображень)
6. Натисніть **"Create bucket"**

## Крок 2: Політики доступу (RLS)

1. Відкрийте bucket **housing-photos** → **Policies**
2. Додайте політики. У полі **Policy definition** вставляйте **тільки** SQL-рядок з прикладу нижче — нічого іншого (ні пояснень, ні зайвих символів).

### INSERT — завантаження

**Policy name:** `Users can upload housing photos`

**Allowed operation:** INSERT

**Policy definition** — вставте **тільки** цей рядок (скопіюйте й вставте, без пояснень):
```
bucket_id = 'housing-photos' AND name LIKE (auth.uid()::text || '/%')
```

### SELECT — перегляд

**Policy name:** `Public can view housing photos`

**Allowed operation:** SELECT

**Policy definition:**
```
bucket_id = 'housing-photos'
```

### UPDATE

**Policy name:** `Users can update own housing photos`

**Allowed operation:** UPDATE

**Policy definition** (USING і WITH CHECK — той самий вираз):
```
bucket_id = 'housing-photos' AND name LIKE (auth.uid()::text || '/%')
```

### DELETE

**Policy name:** `Users can delete own housing photos`

**Allowed operation:** DELETE

**Policy definition:**
```
bucket_id = 'housing-photos' AND name LIKE (auth.uid()::text || '/%')
```

## Структура файлів

Фото зберігаються за шляхом: `{user_id}/{housing_id}/{timestamp}_{random}.{ext}`

## Обмеження в додатку

- Максимум **3** фото на оголошення
- Максимальний розмір файлу: **10 MB**
- Формати: JPG, PNG, WebP, GIF
- Фото **стискаються** перед завантаженням (макс. ~1.2 MB, макс. сторона 1920 px) — швидше завантаження та перегляд
