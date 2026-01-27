-- ============================================
-- Дозволити адмінам видаляти користувачів (profiles)
-- ============================================
-- Без цієї політики кнопка «Видалити» в адмінці не працює (RLS блокує).
-- Виконайте в Supabase → SQL Editor → Run.
--
-- Важливо: адмін має мати is_admin = true у своєму профілі. Якщо ви лише
-- в ADMIN_EMAILS у коді — оновіть свій profile в Table Editor: is_admin = true.
-- ============================================

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- ============================================
-- Готово. Перезавантажте адмін-панель і спробуйте видалити користувача.
-- ============================================
