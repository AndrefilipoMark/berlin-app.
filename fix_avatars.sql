-- Fix Avatar URLs for bots (Real photos in Berlin)
-- Andriy: Berlin vibe, stylish guy
UPDATE public.profiles
SET avatar_url = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Tanyusha: Friendly girl, Berlin background
UPDATE public.profiles
SET avatar_url = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200'
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Add bots to "online" list logic (This is handled in frontend, but we can ensure they have recent last_seen)
UPDATE public.profiles
SET last_seen = NOW()
WHERE is_bot = TRUE;
