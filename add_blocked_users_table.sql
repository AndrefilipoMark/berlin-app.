-- =====================================================
-- BLOCKED_USERS TABLE (Чорний список)
-- =====================================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL, -- Користувач, який блокує
  blocked_user_id UUID NOT NULL, -- Заблокований користувач
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id) -- Один запис блокування між двома користувачами
);

-- Index for faster queries
CREATE INDEX idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);
CREATE INDEX idx_blocked_users_user_blocked ON blocked_users(user_id, blocked_user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Користувач може бачити свої записи блокування
CREATE POLICY "Users can view their own blocked users" ON blocked_users
  FOR SELECT USING (auth.uid() = user_id);

-- Користувач може створювати записи блокування
CREATE POLICY "Users can create blocked users" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Користувач може видаляти свої записи блокування (розблокувати)
CREATE POLICY "Users can delete their own blocked users" ON blocked_users
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for updated_at
CREATE TRIGGER update_blocked_users_updated_at BEFORE UPDATE ON blocked_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
