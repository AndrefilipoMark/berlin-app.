-- Виправлення зв'язку між подіями та профілями авторів
-- Це необхідно для відображення автора події та коректної роботи запитів

-- 1. Додаємо Foreign Key для таблиці events (зв'язок з profiles)
ALTER TABLE events
DROP CONSTRAINT IF EXISTS events_user_id_fkey;

ALTER TABLE events
ADD CONSTRAINT events_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Оновлюємо кеш схеми (просто вибірка, щоб переконатися, що все ок)
COMMENT ON CONSTRAINT events_user_id_fkey ON events IS 'Links event to author profile';
