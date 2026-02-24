-- 1. Виправлення Foreign Key для event_rsvp
-- Спочатку видаляємо старі constraints, якщо вони є
ALTER TABLE event_rsvp
DROP CONSTRAINT IF EXISTS event_rsvp_user_id_fkey;

ALTER TABLE event_rsvp
DROP CONSTRAINT IF EXISTS event_rsvp_event_id_fkey;

-- Додаємо правильний constraint для user_id (посилається на profiles)
ALTER TABLE event_rsvp
ADD CONSTRAINT event_rsvp_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Додаємо правильний constraint для event_id (посилається на events)
ALTER TABLE event_rsvp
ADD CONSTRAINT event_rsvp_event_id_fkey
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- 2. Налаштування автоматичного видалення старих подій
-- Створюємо функцію для видалення старих подій (старше 1 дня)
CREATE OR REPLACE FUNCTION delete_old_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM events
  WHERE event_date < NOW() - INTERVAL '1 day';
END;
$$;

-- Спроба активувати pg_cron (якщо доступно)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Планування задачі (раз на день о 3:00 ночі)
-- SELECT cron.schedule('delete-old-events', '0 3 * * *', 'SELECT delete_old_events()');

-- Якщо pg_cron недоступний, ми також додали фільтрацію на клієнті (в коді), 
-- щоб старі події не відображалися.
