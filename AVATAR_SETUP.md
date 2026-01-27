# 📸 Налаштування завантаження аватарок

## Крок 1: Створити Storage Bucket в Supabase

1. Відкрийте ваш проект в [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдіть в **Storage** (ліва панель)
3. Натисніть **"New bucket"**
4. Введіть назву: `avatars`
5. Оберіть **Public bucket** (щоб зображення були доступні публічно)
6. Натисніть **"Create bucket"**

## Крок 2: Налаштувати політики доступу (RLS)

1. Після створення bucket, натисніть на нього
2. Перейдіть в **Policies**
3. Натисніть **"New Policy"** або **"Add Policy"**

### Політика 1: Дозволити завантаження (INSERT)

**Policy Name:** `Users can upload their own avatars`

**Allowed operation:** ✅ INSERT

**Policy definition (using RLS):**
```sql
bucket_id = 'avatars'::text AND (storage.foldername(name))[1] = (auth.uid())::text
```

**WITH CHECK expression:**
```sql
bucket_id = 'avatars'::text AND (storage.foldername(name))[1] = (auth.uid())::text
```

### Політика 2: Дозволити перегляд (SELECT)

**Policy Name:** `Public can view avatars`

**Allowed operation:** ✅ SELECT

**Policy definition (using RLS):**
```sql
bucket_id = 'avatars'::text
```

### Політика 3: Дозволити видалення (DELETE)

**Policy Name:** `Users can delete their own avatars`

**Allowed operation:** ✅ DELETE

**Policy definition (using RLS):**
```sql
bucket_id = 'avatars'::text AND (storage.foldername(name))[1] = (auth.uid())::text
```

### Політика 4: Дозволити оновлення (UPDATE)

**Policy Name:** `Users can update their own avatars`

**Allowed operation:** ✅ UPDATE

**Policy definition (using RLS):**
```sql
bucket_id = 'avatars'::text AND (storage.foldername(name))[1] = (auth.uid())::text
```

**WITH CHECK expression:**
```sql
bucket_id = 'avatars'::text AND (storage.foldername(name))[1] = (auth.uid())::text
```

## Альтернативний спосіб (якщо політики не працюють):

Якщо виникають проблеми з політиками, можна тимчасово вимкнути RLS для bucket:

1. Перейдіть в **Storage** → **avatars** bucket
2. Відкрийте **Settings**
3. Вимкніть **"Enforce RLS"** (не рекомендовано для продакшену)
4. Або створіть політику, яка дозволяє все для авторизованих користувачів:

```sql
bucket_id = 'avatars'::text AND auth.role() = 'authenticated'
```

**Allowed operations:** INSERT, SELECT, UPDATE, DELETE

## Крок 3: Перевірити роботу

1. Відкрийте сторінку налаштувань профілю
2. Натисніть на іконку камери біля аватарки
3. Оберіть зображення (JPG, PNG, до 5MB)
4. Після завантаження натисніть "Зберегти зміни"

✅ Аватарка з'явиться в профілі та на всіх сторінках!

## Обмеження

- Максимальний розмір файлу: **5MB**
- Підтримувані формати: **JPG, PNG, GIF, WebP**
- Автоматичне видалення старого аватара при завантаженні нового
