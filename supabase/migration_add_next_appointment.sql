-- Migration: Add Next Appointment Date and Time fields to patients table
-- Purpose: Allow professionals to schedule patient's next appointment during patient updates
-- This supports the post-visit appointment scheduling feature

-- Add next_appointment_date column (DATE type)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS next_appointment_date DATE;

-- Add next_appointment_time column (TIME type for storing HH:MM format)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS next_appointment_time TIME;

-- Add index for faster querying of upcoming appointments
CREATE INDEX IF NOT EXISTS idx_patients_next_appointment_date ON patients(next_appointment_date);

-- Add comments explaining the fields (optional but helpful for documentation)
COMMENT ON COLUMN patients.next_appointment_date IS 'The date of the patient''s next scheduled appointment';
COMMENT ON COLUMN patients.next_appointment_time IS 'The time (HH:MM format) of the patient''s next scheduled appointment';

-- Verification query (run after migration to confirm):
-- SELECT id, name, next_appointment_date, next_appointment_time FROM patients LIMIT 1;
