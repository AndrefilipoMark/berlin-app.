-- Оновлення replies_count у forum_posts при додаванні/видаленні коментарів
-- Запустіть у Supabase SQL Editor (після add_forum_likes_tables.sql не обовʼязково).

-- Колонка має існувати, інакше тригер падатиме при INSERT у forum_replies
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_forum_posts_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET replies_count = COALESCE(replies_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET replies_count = GREATEST(COALESCE(replies_count, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_forum_posts_replies_count ON forum_replies;
CREATE TRIGGER tr_forum_posts_replies_count
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_forum_posts_replies_count();
