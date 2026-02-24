-- =====================================================
-- COMPLETE EVENTS SETUP SCRIPT
-- =====================================================
-- This script ensures the events table, rsvp table, and storage are correctly set up.
-- Run this in Supabase SQL Editor to fix "Event not created" issues.

-- 1. Create EVENTS table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255),
  map_link TEXT,
  image_url TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create EVENT_RSVP table
CREATE TABLE IF NOT EXISTS event_rsvp (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('going', 'maybe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvp ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for EVENTS

-- Public can view events
DROP POLICY IF EXISTS "Public can view events" ON events;
CREATE POLICY "Public can view events" ON events
  FOR SELECT USING (true);

-- Authenticated users can create events
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
CREATE POLICY "Authenticated users can insert events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authors can update their events
DROP POLICY IF EXISTS "Users can update their own events" ON events;
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

-- Authors can delete their events
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- 5. RLS Policies for EVENT_RSVP

-- Public can view RSVPs
DROP POLICY IF EXISTS "Public can view rsvps" ON event_rsvp;
CREATE POLICY "Public can view rsvps" ON event_rsvp
  FOR SELECT USING (true);

-- Authenticated users can RSVP
DROP POLICY IF EXISTS "Authenticated users can insert rsvps" ON event_rsvp;
CREATE POLICY "Authenticated users can insert rsvps" ON event_rsvp
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own RSVP
DROP POLICY IF EXISTS "Users can update their own rsvps" ON event_rsvp;
CREATE POLICY "Users can update their own rsvps" ON event_rsvp
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own RSVP
DROP POLICY IF EXISTS "Users can delete their own rsvps" ON event_rsvp;
CREATE POLICY "Users can delete their own rsvps" ON event_rsvp
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Storage Bucket for Event Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage Policies
DROP POLICY IF EXISTS "Public can view event photos" ON storage.objects;
CREATE POLICY "Public can view event photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-photos');

DROP POLICY IF EXISTS "Users can upload event photos" ON storage.objects;
CREATE POLICY "Users can upload event photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-photos' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update event photos" ON storage.objects;
CREATE POLICY "Users can update event photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'event-photos' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete event photos" ON storage.objects;
CREATE POLICY "Users can delete event photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'event-photos' AND auth.uid() = owner);

-- 8. Helper function for deleting old events (optional maintenance)
CREATE OR REPLACE FUNCTION delete_old_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM events
  WHERE event_date < NOW() - INTERVAL '1 day';
END;
$$;
