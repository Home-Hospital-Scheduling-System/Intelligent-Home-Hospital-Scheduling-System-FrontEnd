-- Migration: Add area and care_needed columns to patients table
-- Ensures patient signup data (address/area/care preferences) is stored.

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS care_needed TEXT;

-- Helpful indexes for coordinator/professional filtering
CREATE INDEX IF NOT EXISTS idx_patients_area ON patients(area);
CREATE INDEX IF NOT EXISTS idx_patients_care_needed ON patients(care_needed);
