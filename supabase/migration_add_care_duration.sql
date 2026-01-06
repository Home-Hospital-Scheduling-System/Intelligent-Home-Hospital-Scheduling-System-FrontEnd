-- Migration: Add estimated visit duration field to patients table
-- This allows professionals to specify custom care duration instead of using default estimates

-- Add estimated_care_duration column (in minutes)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS estimated_care_duration INTEGER DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN patients.estimated_care_duration IS 'Custom estimated time needed for patient care in minutes. If NULL, system uses default based on care type.';

-- Example durations:
-- 30 = Quick check-up, medication administration
-- 45 = Standard wound care, basic nursing
-- 60 = Physical therapy, complex care
-- 90 = Extended rehabilitation, palliative care
-- 120 = Comprehensive assessment, multiple procedures
