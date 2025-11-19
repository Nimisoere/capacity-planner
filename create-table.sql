-- Create the schedules table manually in Supabase SQL Editor
-- Copy and paste this into: https://supabase.com/dashboard/project/lubvddhfxyksjqolofkk/sql

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  planning_period JSONB NOT NULL,
  week_config JSONB NOT NULL,
  people JSONB NOT NULL,
  holidays JSONB NOT NULL,
  fr_schedule JSONB NOT NULL,
  fr_capacity_days INTEGER NOT NULL DEFAULT 3,
  projects JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_updated_at ON schedules(updated_at DESC);

-- Verify the table was created
SELECT 'Table created successfully!' as message;
