-- =====================================================
-- MIGRATION: Add Missing Columns to Patients Table
-- =====================================================
-- Your current patients table is missing these columns that
-- the AddPatient component tries to insert:
--   - latitude, longitude (for GPS-based scheduling)
--   - estimated_care_duration (for custom visit times)
--   - service_area (used in some scheduling functions)
-- =====================================================

-- 1. Add geo-location columns (for GPS-based scheduling)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 2. Add estimated care duration column (in minutes)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS estimated_care_duration INTEGER;

-- 3. Add service_area column (used by scheduling optimizer)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS service_area TEXT;

-- 4. Create indexes for geo-location queries
CREATE INDEX IF NOT EXISTS idx_patients_geo ON patients(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_patients_service_area ON patients(service_area);

-- =====================================================
-- VERIFICATION: Run this to see updated schema
-- =====================================================
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'patients' 
-- ORDER BY ordinal_position;
