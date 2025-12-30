-- Migration: Add Visit Scheduling Columns to patient_assignments
-- This migration adds columns to support scheduling visits for assigned patients

ALTER TABLE patient_assignments 
ADD COLUMN IF NOT EXISTS scheduled_visit_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_visit_time TIME,
ADD COLUMN IF NOT EXISTS service_area VARCHAR(100);

-- Create indexes for faster queries on visit scheduling
CREATE INDEX IF NOT EXISTS idx_patient_assignments_visit_date ON patient_assignments(scheduled_visit_date);
CREATE INDEX IF NOT EXISTS idx_patient_assignments_service_area ON patient_assignments(service_area);
