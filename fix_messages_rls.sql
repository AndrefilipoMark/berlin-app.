-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate and avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
DROP POLICY IF EXISTS "Everyone can read messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Policy 1: Everyone can read messages
-- This allows any user (authenticated or anonymous) to see chat messages.
CREATE POLICY "Everyone can read messages" ON messages
  FOR SELECT USING (true);

-- Policy 2: Authenticated users can insert their own messages
-- The user_id column in the new row must match the authenticated user's ID.
CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy 4: Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);
