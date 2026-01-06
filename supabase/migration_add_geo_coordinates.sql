-- Migration: Add Geo Coordinates to Patients Table
-- This enables real distance-based scheduling instead of zone-based estimates

-- Add latitude and longitude columns to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for geo queries
CREATE INDEX IF NOT EXISTS idx_patients_geo ON patients (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add latitude and longitude to professionals table (their starting location)
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS home_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS home_longitude DECIMAL(11, 8);

-- Comment explaining the fields
COMMENT ON COLUMN patients.latitude IS 'GPS latitude coordinate for patient address';
COMMENT ON COLUMN patients.longitude IS 'GPS longitude coordinate for patient address';
COMMENT ON COLUMN professionals.home_latitude IS 'GPS latitude for professional starting location';
COMMENT ON COLUMN professionals.home_longitude IS 'GPS longitude for professional starting location';

-- Update existing patients with approximate coordinates based on their area
-- These are center points for each Oulu district - will be refined by geocoding actual addresses

-- Keskusta (City Center) - Oulu city center
UPDATE patients SET latitude = 65.0121, longitude = 25.4651 WHERE area = 'Keskusta (City Center)' AND latitude IS NULL;

-- Raksila - Sports and business area
UPDATE patients SET latitude = 65.0050, longitude = 25.4800 WHERE area = 'Raksila' AND latitude IS NULL;

-- Tuira - Northern residential area
UPDATE patients SET latitude = 65.0250, longitude = 25.4550 WHERE area = 'Tuira' AND latitude IS NULL;

-- Meri-Oulu - Coastal area
UPDATE patients SET latitude = 65.0400, longitude = 25.4200 WHERE area = 'Meri-Oulu' AND latitude IS NULL;

-- Pateniemi - Far north coastal
UPDATE patients SET latitude = 65.0550, longitude = 25.4100 WHERE area = 'Pateniemi' AND latitude IS NULL;

-- Pohjois-Oulu - Northern Oulu
UPDATE patients SET latitude = 65.0600, longitude = 25.5200 WHERE area = 'Pohjois-Oulu' AND latitude IS NULL;

-- Kontinkangas - University hospital area
UPDATE patients SET latitude = 65.0080, longitude = 25.5100 WHERE area = 'Kontinkangas' AND latitude IS NULL;

-- Kaakkuri - Southern residential
UPDATE patients SET latitude = 64.9900, longitude = 25.5300 WHERE area = 'Kaakkuri' AND latitude IS NULL;

-- Myllyoja - Central residential
UPDATE patients SET latitude = 65.0000, longitude = 25.4500 WHERE area = 'Myllyoja' AND latitude IS NULL;

-- Set default starting location for professionals (Oulu University Hospital)
UPDATE professionals SET home_latitude = 65.0080, home_longitude = 25.5100 
WHERE home_latitude IS NULL;

-- Verify the migration
SELECT 
  area,
  COUNT(*) as patient_count,
  AVG(latitude) as avg_lat,
  AVG(longitude) as avg_lng
FROM patients 
WHERE latitude IS NOT NULL
GROUP BY area
ORDER BY area;
