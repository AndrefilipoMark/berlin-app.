-- ============================================
-- Дозволити адмінам видаляти вакансії, житло, сервіси, форум, повідомлення
-- ============================================
-- Без цих політик адмін не може видаляти записи у вкладках Вакансії, Житло тощо
-- (RLS дозволяє лише власнику). Виконайте в Supabase → SQL Editor → Run.
--
-- Адмін має мати is_admin = true у профілі (profiles).
-- ============================================

-- Допоміжна перевірка: чи поточний користувач — адмін
-- (використовується в USING нижче)

-- Jobs (вакансії)
DROP POLICY IF EXISTS "Admins can delete jobs" ON public.jobs;
CREATE POLICY "Admins can delete jobs"
  ON public.jobs FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Housing (житло)
DROP POLICY IF EXISTS "Admins can delete housing" ON public.housing;
CREATE POLICY "Admins can delete housing"
  ON public.housing FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Services (сервіси)
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
CREATE POLICY "Admins can delete services"
  ON public.services FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Forum posts (пости форуму)
DROP POLICY IF EXISTS "Admins can delete forum_posts" ON public.forum_posts;
CREATE POLICY "Admins can delete forum_posts"
  ON public.forum_posts FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Forum replies (коментарі форуму)
DROP POLICY IF EXISTS "Admins can delete forum_replies" ON public.forum_replies;
CREATE POLICY "Admins can delete forum_replies"
  ON public.forum_replies FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Messages (чат)
DROP POLICY IF EXISTS "Admins can delete messages" ON public.messages;
CREATE POLICY "Admins can delete messages"
  ON public.messages FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================
-- Готово. Адмін зможе видаляти у всіх вкладках (в т.ч. з сторінки вакансії/житла/сервісу).
-- ============================================
