-- Migration: Improved Database Schema v2
-- This script rebuilds the database with a cleaner, non-redundant structure
-- 
-- Changes:
-- 1. profiles table: stores full_name, email, phone, role (no redundancy)
-- 2. patients table: only has profile_id and address (no name/phone/email duplication)
-- 3. professionals table: enhanced with kind and specialty
-- 4. locations table: for clinics/facilities only (not home addresses)
--
-- Run this in Supabase SQL Editor after backing up existing data

-- ============================================================================
-- CLEANUP: Drop existing tables in correct order (reverse of creation)
-- ============================================================================
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS working_hours CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS professionals CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- CREATE IMPROVED SCHEMA
-- ============================================================================

-- 1. PROFILES (core user info - all roles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'professional', 'coordinator', 'supervisor')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. PATIENTS (extends profiles with patient-specific data)
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  address TEXT,
  medical_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. PROFESSIONALS (extends profiles with professional-specific data)
CREATE TABLE professionals (
  id SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'doctor', 'nurse', 'therapist', 'physiotherapist', 'counselor'
  specialty TEXT NOT NULL, -- 'Wound Care', 'Community Nursing', etc.
  license_number TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 4. LOCATIONS (clinics, facilities - NOT home addresses)
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT CHECK (type IN ('clinic', 'hospital', 'nursing_home', 'office')),
  phone TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 5. WORKING_HOURS (professional availability)
CREATE TABLE working_hours (
  id SERIAL PRIMARY KEY,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday >= 1 AND weekday <= 7), -- 1=Mon, 7=Sun
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- 6. SCHEDULES (visits/appointments)
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  assigned_by_profile UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_patients_profile_id ON patients(profile_id);
CREATE INDEX idx_professionals_profile_id ON professionals(profile_id);
CREATE INDEX idx_schedules_patient_id ON schedules(patient_id);
CREATE INDEX idx_schedules_professional_id ON schedules(professional_id);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_working_hours_professional_id ON working_hours(professional_id);

-- ============================================================================
-- OPTIONAL: Enable Row Level Security (RLS) - Uncomment for production
-- ============================================================================
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

-- For now, create a permissive policy for development:
-- CREATE POLICY "profiles_readable" ON profiles FOR SELECT USING (true);
-- CREATE POLICY "patients_readable" ON patients FOR SELECT USING (true);
-- CREATE POLICY "professionals_readable" ON professionals FOR SELECT USING (true);
-- CREATE POLICY "schedules_readable" ON schedules FOR SELECT USING (true);
-- CREATE POLICY "locations_readable" ON locations FOR SELECT USING (true);
-- CREATE POLICY "working_hours_readable" ON working_hours FOR SELECT USING (true);

-- End of migration
