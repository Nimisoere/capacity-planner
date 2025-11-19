-- Team Planner Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  planning_period JSONB NOT NULL DEFAULT '{"startDate": "2025-11-24", "numberOfWeeks": 6}'::jsonb,
  week_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  people JSONB NOT NULL DEFAULT '[]'::jsonb,
  holidays JSONB NOT NULL DEFAULT '{}'::jsonb,
  fr_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  fr_capacity_days INTEGER NOT NULL DEFAULT 3,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS schedules_user_id_idx ON schedules(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS schedules_updated_at_idx ON schedules(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own schedules
CREATE POLICY "Users can view their own schedules"
  ON schedules
  FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

-- Create policy to allow users to insert their own schedules
CREATE POLICY "Users can insert their own schedules"
  ON schedules
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Create policy to allow users to update their own schedules
CREATE POLICY "Users can update their own schedules"
  ON schedules
  FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Create policy to allow users to delete their own schedules
CREATE POLICY "Users can delete their own schedules"
  ON schedules
  FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
