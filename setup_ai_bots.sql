-- 1. Create bots in auth.users first (required for foreign key constraint)
-- We need to insert into auth.users because profiles.id references auth.users.id
-- Note: Direct insertion into auth.users is usually restricted, but possible via SQL Editor in Dashboard

-- Create Andriy AI User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'andriy.ai@berlin-app.com',
  'encrypted_dummy_password', -- This user won't login via password anyway
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Андрій Ші 🤖"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create Tanyusha AI User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'tanyusha.ai@berlin-app.com',
  'encrypted_dummy_password',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Танюша Ші 🌸"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Add is_bot column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;

-- 3. Create/Update Andriy AI Profile
INSERT INTO public.profiles (id, full_name, is_bot, avatar_url, district, gender)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Андрій Ші 🤖', 
  TRUE, 
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Andriy&backgroundColor=b6e3f4', 
  'Berlin', 
  'male'
)
ON CONFLICT (id) DO UPDATE 
SET full_name = EXCLUDED.full_name, is_bot = EXCLUDED.is_bot, avatar_url = EXCLUDED.avatar_url;

-- 4. Create/Update Tanyusha AI Profile
INSERT INTO public.profiles (id, full_name, is_bot, avatar_url, district, gender)
VALUES (
  '00000000-0000-0000-0000-000000000002', 
  'Танюша Ші 🌸', 
  TRUE, 
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Tanyusha&backgroundColor=ffdfbf', 
  'Berlin', 
  'female'
)
ON CONFLICT (id) DO UPDATE 
SET full_name = EXCLUDED.full_name, is_bot = EXCLUDED.is_bot, avatar_url = EXCLUDED.avatar_url;
