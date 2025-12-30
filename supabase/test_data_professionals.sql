-- Test Data: Create sample professionals with specializations and service areas

-- 1. Add specializations for existing professionals
-- First, let's get professional IDs (assuming they exist from previous work)

-- Example: Add specializations for professional ID 1
INSERT INTO professional_specializations (professional_id, specialization, certification_date)
VALUES
  (1, 'Wound Care', NOW()),
  (1, 'Nursing Care', NOW()),
  (1, 'Physical Therapy', NOW());

-- Example: Add specializations for professional ID 2
INSERT INTO professional_specializations (professional_id, specialization, certification_date)
VALUES
  (2, 'Medication Management', NOW()),
  (2, 'Nursing Care', NOW()),
  (2, 'Home Health', NOW());

-- Example: Add specializations for professional ID 3
INSERT INTO professional_specializations (professional_id, specialization, certification_date)
VALUES
  (3, 'Wound Care', NOW()),
  (3, 'Post-operative Care', NOW()),
  (3, 'Rehabilitation', NOW());

-- 2. Add service areas for professionals

-- Professional 1 - serves Keskusta and North areas
INSERT INTO professional_service_areas (professional_id, service_area, is_primary)
VALUES
  (1, 'Keskusta (City Center)', TRUE),
  (1, 'Pohjois-Oulu', FALSE);

-- Professional 2 - serves East and Central areas
INSERT INTO professional_service_areas (professional_id, service_area, is_primary)
VALUES
  (2, 'Raksila', TRUE),
  (2, 'Tuira', FALSE);

-- Professional 3 - serves Multiple areas
INSERT INTO professional_service_areas (professional_id, service_area, is_primary)
VALUES
  (3, 'Keskusta (City Center)', TRUE),
  (3, 'Meri-Oulu', FALSE),
  (3, 'Pateniemi', FALSE);

-- 3. Update professionals table with capacity info
UPDATE professionals 
SET 
  max_daily_hours = 8,
  max_patients = 20,
  current_patient_count = 0
WHERE id IN (1, 2, 3);

-- Verify the data was inserted
SELECT 'Professional Specializations:' as info;
SELECT * FROM professional_specializations;

SELECT 'Professional Service Areas:' as info;
SELECT * FROM professional_service_areas;

SELECT 'Professional Capacity:' as info;
SELECT id, max_daily_hours, max_patients, current_patient_count FROM professionals WHERE id IN (1, 2, 3);
