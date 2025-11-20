-- Team Capacity Planner Database Schema
-- Run this in your Supabase SQL Editor

-- Create schedules table
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX idx_schedules_user_id ON schedules(user_id);

-- Enable Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own schedules
CREATE POLICY "Users can view their own schedules"
  ON schedules FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own schedules"
  ON schedules FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own schedules"
  ON schedules FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON schedules FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);
