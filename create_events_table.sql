-- 1. Створення bucket-а (якщо ще не існує)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Видалення старих політик для сховища (щоб уникнути дублікатів)
DROP POLICY IF EXISTS "Public can view event photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload event photos" ON storage.objects;

-- 3. Створення нових політик для сховища
CREATE POLICY "Public can view event photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-photos');

CREATE POLICY "Users can upload event photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-photos' AND auth.uid() = owner);
