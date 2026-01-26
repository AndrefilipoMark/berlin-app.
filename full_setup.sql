-- =====================================================
-- ПОВНЕ НАЛАШТУВАННЯ БАЗИ ДАНИХ
-- =====================================================
-- Цей файл створює всі таблиці та налаштовує права доступу
-- Виконайте його ОДИН РАЗ в новому проекті Supabase
-- =====================================================

-- Крок 1: Створення таблиць
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- JOBS TABLE (Вакансії)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(10) DEFAULT 'EUR',
  location VARCHAR(255),
  employment_type VARCHAR(50),
  languages JSONB DEFAULT '["DE"]'::jsonb,
  requirements TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  user_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);

-- HOUSING TABLE (Житло)
CREATE TABLE IF NOT EXISTS housing (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  size INTEGER,
  rooms INTEGER,
  address VARCHAR(255) NOT NULL,
  district VARCHAR(100),
  available_from DATE,
  features JSONB DEFAULT '[]'::jsonb,
  utilities_included BOOLEAN DEFAULT false,
  deposit INTEGER,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  images JSONB DEFAULT '[]'::jsonb,
  user_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_housing_created_at ON housing(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_housing_status ON housing(status);
CREATE INDEX IF NOT EXISTS idx_housing_district ON housing(district);
CREATE INDEX IF NOT EXISTS idx_housing_price ON housing(price);

-- SERVICES TABLE (Послуги)
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  profession VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  languages JSONB DEFAULT '["UA"]'::jsonb,
  address VARCHAR(255) NOT NULL,
  district VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  working_hours JSONB,
  rating DECIMAL(2,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  user_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_rating ON services(rating DESC);
CREATE INDEX IF NOT EXISTS idx_services_verified ON services(verified);

-- FORUM_POSTS TABLE (Форум)
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_avatar VARCHAR(10),
  category VARCHAR(100),
  tags JSONB DEFAULT '[]'::jsonb,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  user_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_likes ON forum_posts(likes_count DESC);

-- FORUM_REPLIES TABLE (Відповіді)
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_avatar VARCHAR(10),
  likes_count INTEGER DEFAULT 0,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at);

-- Крок 2: Налаштування Row Level Security
-- =====================================================

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view active jobs" ON jobs
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view active housing" ON housing
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view active forum posts" ON forum_posts
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view forum replies" ON forum_replies
  FOR SELECT USING (true);

-- Public insert access (БЕЗ автентифікації!)
CREATE POLICY "Anyone can insert jobs" ON jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert housing" ON housing
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert services" ON services
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert forum posts" ON forum_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert forum replies" ON forum_replies
  FOR INSERT WITH CHECK (true);

-- Крок 3: Тригери для updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_housing_updated_at BEFORE UPDATE ON housing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Крок 4: Тестові дані (опціонально)
-- =====================================================

INSERT INTO jobs (title, company, category, description, salary_min, salary_max, location, employment_type, languages, contact_email)
VALUES 
  ('Frontend Developer', 'Tech Berlin GmbH', 'IT', 'Шукаємо досвідченого React розробника', 3000, 4500, 'Mitte, Berlin', 'full-time', '["UA", "RU", "DE"]'::jsonb, 'hr@techberlin.de'),
  ('Barista', 'Кафе Паляниця', 'Gastronomy', 'Потрібен барист з досвідом', 1800, 2200, 'Neukölln, Berlin', 'full-time', '["UA", "RU"]'::jsonb, 'info@palianytsia.de')
ON CONFLICT DO NOTHING;

INSERT INTO housing (title, type, description, price, size, rooms, address, district, contact_phone)
VALUES 
  ('2-кімнатна квартира біля метро', 'apartment', 'Затишна квартира в центрі', 950, 65, 2, 'Warschauer Str. 23', 'Friedrichshain', '+49 176 123 4567'),
  ('Кімната в WG', 'room', 'Шукаю співмешканця в friendly WG', 450, 18, 1, 'Sonnenallee 89', 'Neukölln', '+49 176 234 5678')
ON CONFLICT DO NOTHING;

INSERT INTO services (name, profession, category, languages, address, phone, rating)
VALUES 
  ('Dr. Schmidt', 'Стоматолог', 'medical', '["UA", "RU", "DE"]'::jsonb, 'Prenzlauer Berg, Kastanienallee 12', '+49 30 123 4567', 4.8),
  ('Олена', 'Майстер манікюру', 'beauty', '["UA", "RU", "DE"]'::jsonb, 'Mitte, Friedrichstraße 89', '+49 176 987 6543', 5.0)
ON CONFLICT DO NOTHING;

INSERT INTO forum_posts (title, content, author_name, author_avatar, category)
VALUES 
  ('Хто знає гарного стоматолога?', 'Шукаю стоматолога в районі Mitte, який говорить українською', 'Олена К.', '👩‍💼', 'question'),
  ('Де купити українські продукти?', 'Привіт! Хтось знає, де можна купити якісні українські продукти в Берліні?', 'Марія П.', '👩', 'question')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ГОТОВО!
-- =====================================================
-- База даних налаштована та готова до роботи
-- Тепер можна додавати вакансії, житло та сервіси без реєстрації
