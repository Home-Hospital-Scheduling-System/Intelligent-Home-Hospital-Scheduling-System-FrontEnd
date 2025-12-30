-- Migration: Add Patient Visit Time Preferences
-- This migration adds columns to patients table for visit scheduling preferences
-- Allows coordinators to specify when patients prefer care visits

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS preferred_visit_time TIME,
ADD COLUMN IF NOT EXISTS visit_time_flexibility VARCHAR(50) DEFAULT 'flexible' CHECK (visit_time_flexibility IN ('strict', 'flexible', 'very_flexible')),
ADD COLUMN IF NOT EXISTS visit_notes TEXT;

-- Create indexes for faster queries on visit preferences
CREATE INDEX IF NOT EXISTS idx_patients_preferred_visit_time ON patients(preferred_visit_time);
CREATE INDEX IF NOT EXISTS idx_patients_visit_flexibility ON patients(visit_time_flexibility);

-- Example data comments:
-- preferred_visit_time: '09:00' (9 AM preferred), '14:00' (2 PM), or NULL for no preference
-- visit_time_flexibility: 
--   'strict' = must visit at exact time (e.g., medication at specific time)
--   'flexible' = within ±1 hour of preferred time
--   'very_flexible' = within ±2+ hours of preferred time, any time works
-- visit_notes: e.g., "Patient sleeps until 10 AM", "Prefers morning visits"
