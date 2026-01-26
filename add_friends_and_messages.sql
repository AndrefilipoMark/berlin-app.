-- =====================================================
-- FRIENDS TABLE (Друзі)
-- =====================================================
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL, -- Користувач, який відправив запит
  friend_id UUID NOT NULL, -- Користувач, якому відправили запит
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, blocked
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id) -- Один запит між двома користувачами
);

-- Index for faster queries
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);
CREATE INDEX idx_friends_user_friend ON friends(user_id, friend_id);

-- =====================================================
-- PRIVATE_MESSAGES TABLE (Приватні повідомлення)
-- =====================================================
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID NOT NULL, -- Відправник
  receiver_id UUID NOT NULL, -- Отримувач
  message TEXT NOT NULL, -- Текст повідомлення
  read BOOLEAN DEFAULT false, -- Прочитано чи ні
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX idx_private_messages_receiver ON private_messages(receiver_id);
CREATE INDEX idx_private_messages_created_at ON private_messages(created_at DESC);
CREATE INDEX idx_private_messages_read ON private_messages(read);

-- Composite index for conversation queries
CREATE INDEX idx_private_messages_conversation ON private_messages(sender_id, receiver_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Friends policies
-- Користувач може бачити свої запити на дружбу
CREATE POLICY "Users can view their own friend requests" ON friends
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Користувач може створювати запити на дружбу
CREATE POLICY "Users can create friend requests" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Користувач може оновлювати запити, де він отримувач (приймати/відхиляти)
CREATE POLICY "Users can update friend requests they received" ON friends
  FOR UPDATE USING (
    auth.uid() = friend_id
  );

-- Користувач може видаляти свої запити
CREATE POLICY "Users can delete their own friend requests" ON friends
  FOR DELETE USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Private messages policies
-- Користувач може бачити повідомлення, де він відправник або отримувач
CREATE POLICY "Users can view their messages" ON private_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Користувач може відправляти повідомлення
CREATE POLICY "Users can send messages" ON private_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Користувач може оновлювати свої повідомлення (відмічати як прочитані)
CREATE POLICY "Users can update received messages" ON private_messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
  );

-- Користувач може видаляти свої повідомлення
CREATE POLICY "Users can delete their messages" ON private_messages
  FOR DELETE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for updated_at
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_private_messages_updated_at BEFORE UPDATE ON private_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set accepted_at when status changes to 'accepted'
CREATE OR REPLACE FUNCTION set_friend_accepted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    NEW.accepted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_friend_accepted_at_trigger BEFORE UPDATE ON friends
  FOR EACH ROW EXECUTE FUNCTION set_friend_accepted_at();

-- Trigger to set read_at when message is marked as read
CREATE OR REPLACE FUNCTION set_message_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = true AND OLD.read = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_read_at_trigger BEFORE UPDATE ON private_messages
  FOR EACH ROW EXECUTE FUNCTION set_message_read_at();
