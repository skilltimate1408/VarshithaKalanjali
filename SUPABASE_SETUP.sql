-- ============================================
-- EXAM ROOM FINDER — SUPABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- 1. COLLEGES TABLE
CREATE TABLE IF NOT EXISTS colleges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  college_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College can read own record"
  ON colleges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "College can insert own record"
  ON colleges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "College can update own record"
  ON colleges FOR UPDATE
  USING (auth.uid() = user_id);


-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  hall_ticket TEXT NOT NULL,
  student_name TEXT NOT NULL,
  branch TEXT,
  room_no TEXT NOT NULL,
  building TEXT NOT NULL,
  seat_no TEXT NOT NULL,
  exam_date DATE,
  session TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(college_id, hall_ticket, exam_date)
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Colleges can manage their own students
CREATE POLICY "College manages own students"
  ON students FOR ALL
  USING (
    college_id IN (
      SELECT id FROM colleges WHERE user_id = auth.uid()
    )
  );

-- Public read for kiosk (API uses service role key anyway)
CREATE POLICY "Public can read students"
  ON students FOR SELECT
  USING (true);


-- 3. INDEX for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_hall_ticket ON students(hall_ticket);
CREATE INDEX IF NOT EXISTS idx_students_college_id ON students(college_id);


-- Done! Go back to your app and fill in .env.local with your keys.
