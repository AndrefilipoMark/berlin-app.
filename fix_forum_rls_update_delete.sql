-- Дозволити UPDATE та DELETE для forum_posts і forum_replies
-- (потрібно для редагування/видалення постів і коментарів)
-- Запустіть у Supabase SQL Editor.

-- forum_posts
DROP POLICY IF EXISTS "Allow update forum_posts" ON forum_posts;
CREATE POLICY "Allow update forum_posts" ON forum_posts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete forum_posts" ON forum_posts;
CREATE POLICY "Allow delete forum_posts" ON forum_posts FOR DELETE USING (true);

-- forum_replies
DROP POLICY IF EXISTS "Allow update forum_replies" ON forum_replies;
CREATE POLICY "Allow update forum_replies" ON forum_replies FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete forum_replies" ON forum_replies;
CREATE POLICY "Allow delete forum_replies" ON forum_replies FOR DELETE USING (true);
