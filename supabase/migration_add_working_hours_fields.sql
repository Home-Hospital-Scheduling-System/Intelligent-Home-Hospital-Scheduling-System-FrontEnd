-- Migration: Add supervisor assignment metadata and recurrence flag to working_hours
-- This allows supervisors to assign and track weekly working hours for professionals
-- Run this in Supabase SQL Editor

-- Add new columns to working_hours table
ALTER TABLE working_hours
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS assigned_by_profile UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add unique constraint on (professional_id, weekday) to support upserts
-- This ensures only one entry per professional per weekday
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'working_hours_professional_weekday_key'
  ) THEN
    ALTER TABLE working_hours
      ADD CONSTRAINT working_hours_professional_weekday_key UNIQUE (professional_id, weekday);
  END IF;
END $$;

-- Update existing records to have is_recurring = true by default
UPDATE working_hours SET is_recurring = true WHERE is_recurring IS NULL;
