-- =====================================================
-- CLEANUP SCRIPT FOR HOME HOSPITAL SCHEDULING SYSTEM
-- =====================================================
-- This script removes ALL mock data to prepare for fresh insertion
-- WARNING: This deletes data! Use with caution.
-- 
-- Run this BEFORE running mock_data_complete.sql if you want fresh data
-- =====================================================

-- First, disable any triggers temporarily (if needed)
-- ALTER TABLE schedules DISABLE TRIGGER ALL;

-- 1. Delete schedules (visits)
DELETE FROM schedules;
SELECT 'Deleted all schedules' as info;

-- 2. Delete working hours
DELETE FROM working_hours;
SELECT 'Deleted all working hours' as info;

-- 3. Delete professional specializations
DELETE FROM professional_specializations;
SELECT 'Deleted all professional specializations' as info;

-- 4. Delete professional service areas
DELETE FROM professional_service_areas;
SELECT 'Deleted all professional service areas' as info;

-- 5. Delete professionals (but keep the admin/coordinator accounts)
DELETE FROM professionals;
SELECT 'Deleted all professionals' as info;

-- 6. Delete patient records
DELETE FROM patients;
SELECT 'Deleted all patients' as info;

-- 7. Delete patient/professional profiles (keep admin/coordinator/supervisor)
DELETE FROM profiles WHERE role IN ('patient', 'professional');
SELECT 'Deleted patient and professional profiles' as info;

-- 8. Delete locations (optional - uncomment if needed)
-- DELETE FROM locations;
-- SELECT 'Deleted all locations' as info;

-- Reset sequences (so IDs start from 1 again)
-- ALTER SEQUENCE patients_id_seq RESTART WITH 1;
-- ALTER SEQUENCE professionals_id_seq RESTART WITH 1;
-- ALTER SEQUENCE schedules_id_seq RESTART WITH 1;

SELECT '=== CLEANUP COMPLETE ===' as info;
SELECT 'Now run mock_data_complete.sql to insert fresh data' as info;
