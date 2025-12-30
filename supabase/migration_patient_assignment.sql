-- Migration: Add Patient Assignment and Professional Specializations
-- This script adds tables for patient-to-professional assignments and professional certifications
-- Fixed to use INTEGER for professional_id (matches professionals table)

-- 1. Create professional_specializations table
CREATE TABLE IF NOT EXISTS professional_specializations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  specialization VARCHAR(100) NOT NULL,
  years_experience INTEGER DEFAULT 0,
  certification_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(professional_id, specialization)
);

-- 2. Create professional_service_areas table
CREATE TABLE IF NOT EXISTS professional_service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_area VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(professional_id, service_area)
);

-- 3. Create patient_assignments table
CREATE TABLE IF NOT EXISTS patient_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  assigned_by_id UUID REFERENCES profiles(id),
  assignment_date TIMESTAMP DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, reassigned, cancelled
  assignment_reason VARCHAR(255),
  match_score INTEGER, -- 0-100 confidence score
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(patient_id, professional_id, status)
);

-- 4. Create assignment_history table for audit trail
CREATE TABLE IF NOT EXISTS assignment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  previous_professional_id INTEGER REFERENCES professionals(id),
  new_professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  changed_by_id UUID NOT NULL REFERENCES profiles(id),
  reason VARCHAR(255),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add new columns to professionals table for capacity management
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS max_daily_hours INTEGER DEFAULT 8;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS max_patients INTEGER DEFAULT 20;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS current_patient_count INTEGER DEFAULT 0;

-- 6. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_patient_assignments_professional ON patient_assignments(professional_id);
CREATE INDEX IF NOT EXISTS idx_patient_assignments_patient ON patient_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_assignments_status ON patient_assignments(status);
CREATE INDEX IF NOT EXISTS idx_professional_specializations ON professional_specializations(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_service_areas ON professional_service_areas(professional_id);
