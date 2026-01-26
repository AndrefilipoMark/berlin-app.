-- =====================================================
-- ADMIN_MESSAGES TABLE (Повідомлення адміну)
-- =====================================================

-- Спочатку переконаємося, що функція update_updated_at_column існує
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тепер створюємо таблицю
CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID, -- Reference to auth.users (optional - can be anonymous)
  user_name VARCHAR(255), -- Name of the sender
  user_email VARCHAR(255), -- Email of the sender (optional)
  subject VARCHAR(255) NOT NULL, -- Subject/title of the message
  message TEXT NOT NULL, -- Message content
  message_type VARCHAR(50) DEFAULT 'general', -- general, bug, suggestion, feedback
  status VARCHAR(20) DEFAULT 'new', -- new, read, replied, resolved
  admin_notes TEXT, -- Admin's internal notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_admin_messages_created_at ON admin_messages(created_at DESC);
CREATE INDEX idx_admin_messages_status ON admin_messages(status);
CREATE INDEX idx_admin_messages_user_id ON admin_messages(user_id);

-- Enable RLS
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Public can insert (anyone can send messages to admin)
CREATE POLICY "Public can insert admin messages" ON admin_messages
  FOR INSERT WITH CHECK (true);

-- Only admins can view all messages
CREATE POLICY "Admins can view all admin messages" ON admin_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Users can view their own messages
CREATE POLICY "Users can view their own messages" ON admin_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can update messages
CREATE POLICY "Admins can update admin messages" ON admin_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Only admins can delete messages
CREATE POLICY "Admins can delete admin messages" ON admin_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_admin_messages_updated_at BEFORE UPDATE ON admin_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
