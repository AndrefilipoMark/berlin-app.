-- Таблиці лайків для форуму: пости та коментарі
-- Запустіть у Supabase SQL Editor.
-- Якщо виникне помилка з EXECUTE FUNCTION, замініть на EXECUTE PROCEDURE.

-- Колонки для тригерів лайків (мають існувати до створення тригерів)
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Лайки постів
CREATE TABLE IF NOT EXISTS forum_post_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post_id ON forum_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user_id ON forum_post_likes(user_id);

-- Лайки коментарів (відповідей)
CREATE TABLE IF NOT EXISTS forum_reply_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reply_id UUID NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_reply_id ON forum_reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_user_id ON forum_reply_likes(user_id);

-- Тригер: оновлення likes_count у forum_posts
CREATE OR REPLACE FUNCTION update_forum_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_forum_post_likes_count ON forum_post_likes;
CREATE TRIGGER tr_forum_post_likes_count
  AFTER INSERT OR DELETE ON forum_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_forum_post_likes_count();

-- Тригер: оновлення likes_count у forum_replies
CREATE OR REPLACE FUNCTION update_forum_reply_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_replies SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.reply_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_replies SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.reply_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_forum_reply_likes_count ON forum_reply_likes;
CREATE TRIGGER tr_forum_reply_likes_count
  AFTER INSERT OR DELETE ON forum_reply_likes
  FOR EACH ROW EXECUTE FUNCTION update_forum_reply_likes_count();

-- RLS
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reply_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read forum_post_likes" ON forum_post_likes;
CREATE POLICY "Allow read forum_post_likes" ON forum_post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert forum_post_likes" ON forum_post_likes;
CREATE POLICY "Allow insert forum_post_likes" ON forum_post_likes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete forum_post_likes" ON forum_post_likes;
CREATE POLICY "Allow delete forum_post_likes" ON forum_post_likes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow read forum_reply_likes" ON forum_reply_likes;
CREATE POLICY "Allow read forum_reply_likes" ON forum_reply_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert forum_reply_likes" ON forum_reply_likes;
CREATE POLICY "Allow insert forum_reply_likes" ON forum_reply_likes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete forum_reply_likes" ON forum_reply_likes;
CREATE POLICY "Allow delete forum_reply_likes" ON forum_reply_likes FOR DELETE USING (true);
