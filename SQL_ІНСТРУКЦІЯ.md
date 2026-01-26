# 🗄️ Як виконати SQL скрипт у Supabase

## 📍 Навігація в Supabase Dashboard

```
Supabase.com → Ваш проект → SQL Editor → New query
```

---

## 🎯 ПОКРОКОВА ІНСТРУКЦІЯ:

### Крок 1: Відкрийте Supabase
┌────────────────────────────────────────────┐
│  https://supabase.com                      │
└────────────────────────────────────────────┘

### Крок 2: Оберіть проект
┌────────────────────────────────────────────┐
│  vlujifpvoqahbzvsgopa                      │
└────────────────────────────────────────────┘

### Крок 3: Знайдіть SQL Editor в лівому меню

```
╔═══════════════════════════╗
║  🏠 Home                  ║
║  📊 Table Editor          ║
║  🔍 SQL Editor  ← ТУТ!    ║
║  📝 Database              ║
║  ⚙️  Settings             ║
╚═══════════════════════════╝
```

### Крок 4: Створіть новий запит

Натисніть кнопку вгорі справа:
┌────────────────────────────────────────────┐
│  [+ New query]                             │
└────────────────────────────────────────────┘

### Крок 5: Скопіюйте SQL код

Відкрийте файл `fix_rls_policies.sql` та скопіюйте **ВЕСЬ** вміст.

Або скопіюйте цей код:

```sql
-- Видаляємо старі політики INSERT
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can insert housing" ON housing;
DROP POLICY IF EXISTS "Authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Authenticated users can insert forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Authenticated users can insert forum replies" ON forum_replies;

-- Створюємо нові політики (публічний доступ)
CREATE POLICY "Anyone can insert jobs" ON jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert housing" ON housing
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert services" ON services
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert forum posts" ON forum_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert forum replies" ON forum_replies
  FOR INSERT WITH CHECK (true);
```

### Крок 6: Вставте в SQL Editor

```
┌───────────────────────────────────────────────────┐
│  Untitled Query                    [▶ Run] [Save] │
├───────────────────────────────────────────────────┤
│                                                    │
│  DROP POLICY IF EXISTS "Authenticated users...    │
│  [вставте весь скопійований код сюди]             │
│                                                    │
│                                                    │
└───────────────────────────────────────────────────┘
```

### Крок 7: Запустіть скрипт

Натисніть кнопку **[▶ Run]** або `Ctrl + Enter`

### Крок 8: Перевірте результат

✅ **Успіх виглядає так:**
```
┌───────────────────────────────────────────────────┐
│  ✅ Success. No rows returned                     │
│  Completed in 123ms                               │
└───────────────────────────────────────────────────┘
```

❌ **Помилка виглядає так:**
```
┌───────────────────────────────────────────────────┐
│  ❌ Error: relation "jobs" does not exist         │
│  Line 1: DROP POLICY IF EXISTS...                 │
└───────────────────────────────────────────────────┘
```

Якщо помилка - таблиці ще не створені! Спочатку виконайте `database_schema.sql`

---

## 🔍 Перевірка виконання

### Спосіб 1: Через Authentication Policies

1. В Supabase перейдіть: **Authentication** → **Policies**
2. Знайдіть таблицю **jobs**
3. Повинна бути політика: **"Anyone can insert jobs"**
4. З параметрами:
   - Operation: `INSERT`
   - Target roles: `public`
   - USING expression: (пусто)
   - WITH CHECK expression: `true`

### Спосіб 2: Спробувати додати вакансію

1. Відкрийте http://localhost:5173/
2. Натисніть "+" (FAB)
3. Додайте вакансію
4. Якщо з'явиться "Вакансія успішно додана!" - все працює! ✅

---

## ❓ Troubleshooting

### Помилка: "relation 'jobs' does not exist"

**Проблема:** Таблиці ще не створені в базі даних

**Рішення:**
1. Спочатку виконайте файл `database_schema.sql`
2. Потім виконайте `fix_rls_policies.sql`

### Помилка: "policy 'Anyone can insert jobs' already exists"

**Проблема:** Ви вже виконували цей скрипт раніше

**Рішення:**
- Це не помилка! Політика вже створена
- Спробуйте додати вакансію на сайті
- Має працювати

### Помилка: "permission denied for table jobs"

**Проблема:** Скрипт не виконався повністю

**Рішення:**
1. Виконайте скрипт ще раз
2. Переконайтесь, що з'явилося "Success"
3. Перевірте в Authentication → Policies

---

## 📊 Що робить цей скрипт?

### ДО виконання:
```
❌ Тільки авторизовані користувачі можуть додавати вакансії
   (auth.uid() = user_id)
```

### ПІСЛЯ виконання:
```
✅ Будь-хто може додавати вакансії
   (true)
```

---

## 🔐 Безпека

⚠️ **Увага:** Ці налаштування дозволяють БУДЬ-КОМУ додавати контент

**Підходить для:**
- ✅ Розробки
- ✅ Тестування
- ✅ MVP
- ✅ Невеликих спільнот

**Для production додайте:**
- 🔒 Автентифікацію
- 🔒 Модерацію
- 🔒 Rate limiting
- 🔒 CAPTCHA

---

## ✅ Готово!

Після виконання SQL скрипту ви зможете:
- ✅ Додавати вакансії
- ✅ Додавати житло
- ✅ Додавати сервіси
- ✅ Створювати пости на форумі

Все без реєстрації!

---

**Успіхів!** 🚀
