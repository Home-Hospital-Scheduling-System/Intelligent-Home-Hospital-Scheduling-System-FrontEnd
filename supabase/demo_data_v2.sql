-- Demo data for improved schema v2
-- Insert into tables in correct order (respecting foreign keys)

-- 1. PROFILES (all users - patients, professionals, coordinators, supervisors)
INSERT INTO public.profiles (id, full_name, email, phone, role) VALUES
  -- Coordinators
  ('1f3e9c5a-9c1f-4b2a-8c69-8e0a3f6a1111', 'Amina Chowdhury', 'amina@hospital.com', '+8801710000001', 'coordinator'),
  
  -- Supervisors
  ('2b4d9d6b-2a2b-4f3b-9b2a-1e2f3a4b2222', 'Tanvir Hossain', 'tanvir@hospital.com', '+8801710000002', 'supervisor'),
  
  -- Professionals (doctors, nurses)
  ('3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333', 'Dr. Janne Korpela', 'janne@hospital.com', '+358401234567', 'professional'),
  ('4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444', 'Nurse Maria Gomez', 'maria@hospital.com', '+8801710000004', 'professional'),
  ('5c7d8e9f-5e5e-6f6a-3f5e-5a6b7c8d9999', 'Dr. Ahmed Khan', 'ahmed@hospital.com', '+8801720000005', 'professional'),
  
  -- Patients
  ('6f8b0cac-6e6f-7a7b-3f6f-6b7c8d9e6666', 'Fatima Rahman', 'fatima.rahman@example.com', '+8801712345678', 'patient'),
  ('7a9c1dbd-7f7a-8b8c-4f7a-7c8d9e0f7777', 'Mohammad Ali', 'mohammad.ali@example.com', '+8801711122233', 'patient'),
  ('8b0d2e9c-8e8b-9c9d-5f8b-8d9e0f1a8888', 'Laila Begum', 'laila.begum@example.com', '+8801712233445', 'patient');

-- 2. PROFESSIONALS (extends profile data with specialty)
INSERT INTO public.professionals (profile_id, kind, specialty, license_number) VALUES
  ('3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333', 'doctor', 'Wound Care Specialist', 'LIC-001-2024'),
  ('4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444', 'nurse', 'Community Nursing', 'LIC-002-2024'),
  ('5c7d8e9f-5e5e-6f6a-3f5e-5a6b7c8d9999', 'doctor', 'Cardiology', 'LIC-003-2024');

-- 3. PATIENTS (extends profile data with address)
INSERT INTO public.patients (profile_id, address, medical_notes) VALUES
  ('6f8b0cac-6e6f-7a7b-3f6f-6b7c8d9e6666', 'House 12, Gulshan, Dhaka', 'Diabetes, requires weekly monitoring'),
  ('7a9c1dbd-7f7a-8b8c-4f7a-7c8d9e0f7777', 'House 34, Mirpur, Dhaka', 'Post-surgery recovery, mobility limited'),
  ('8b0d2e9c-8e8b-9c9d-5f8b-8d9e0f1a8888', 'House 56, Dhanmondi, Dhaka', 'Hypertension management, elderly care');

-- 4. LOCATIONS (clinics and facilities)
INSERT INTO public.locations (name, address, type, phone) VALUES
  ('Central Health Clinic', '123 Main Road, Dhaka', 'clinic', '+8801600000100'),
  ('City Hospital', '456 Hospital Avenue, Dhaka', 'hospital', '+8801600000200'),
  ('Home Care Office', '789 Care Street, Dhaka', 'office', '+8801600000300');

-- 5. WORKING_HOURS (recurring weekly shifts)
-- Dr. Janne: Mon-Fri 09:00-17:00
INSERT INTO public.working_hours (professional_id, weekday, start_time, end_time) VALUES
  ((SELECT id FROM public.professionals WHERE profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'), 1, '09:00:00', '17:00:00'),
  ((SELECT id FROM public.professionals WHERE profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'), 2, '09:00:00', '17:00:00'),
  ((SELECT id FROM public.professionals WHERE profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'), 3, '09:00:00', '17:00:00'),
  ((SELECT id FROM public.professionals WHERE profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'), 4, '09:00:00', '17:00:00'),
  ((SELECT id FROM public.professionals WHERE profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'), 5, '09:00:00', '17:00:00');

-- Nurse Maria: Tue-Sat 08:00-16:00
INSERT INTO public.working_hours (professional_id, weekday, start_time, end_time) VALUES
  ((SELECT id FROM public.professionals WHERE profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'), 2, '08:00:00', '16:00:00'),
  ((SELECT id FROM public.professionals WHERE profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'), 3, '08:00:00', '16:00:00'),
  ((SELECT id FROM public.professionals WHERE profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'), 4, '08:00:00', '16:00:00'),
  ((SELECT id FROM public.professionals WHERE profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'), 5, '08:00:00', '16:00:00'),
  ((SELECT id FROM public.professionals WHERE profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'), 6, '08:00:00', '16:00:00');

-- Dr. Ahmed: Mon, Wed, Fri 14:00-22:00
INSERT INTO public.working_hours (professional_id, weekday, start_time, end_time) VALUES
  ((SELECT id FROM public.professionals WHERE profile_id = '5c7d8e9f-5e5e-6f6a-3f5e-5a6b7c8d9999'), 1, '14:00:00', '22:00:00'),
  ((SELECT id FROM public.professionals WHERE profile_id = '5c7d8e9f-5e5e-6f6a-3f5e-5a6b7c8d9999'), 3, '14:00:00', '22:00:00'),
  ((SELECT id FROM public.professionals WHERE profile_id = '5c7d8e9f-5e5e-6f6a-3f5e-5a6b7c8d9999'), 5, '14:00:00', '22:00:00');

-- 6. SCHEDULES (visits)
INSERT INTO public.schedules (patient_id, professional_id, location_id, assigned_by_profile, start_time, end_time, status, notes) VALUES
  (
    (SELECT id FROM public.patients WHERE profile_id = '6f8b0cac-6e6f-7a7b-3f6f-6b7c8d9e6666'),
    (SELECT id FROM public.professionals WHERE profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'),
    (SELECT id FROM public.locations WHERE name = 'Home Care Office'),
    '1f3e9c5a-9c1f-4b2a-8c69-8e0a3f6a1111',
    '2025-12-15 09:00:00', '2025-12-15 09:45:00', 'scheduled', 'Wound assessment and dressing change'
  ),
  (
    (SELECT id FROM public.patients WHERE profile_id = '7a9c1dbd-7f7a-8b8c-4f7a-7c8d9e0f7777'),
    (SELECT id FROM public.professionals WHERE profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'),
    (SELECT id FROM public.locations WHERE name = 'Central Health Clinic'),
    '1f3e9c5a-9c1f-4b2a-8c69-8e0a3f6a1111',
    '2025-12-16 14:00:00', '2025-12-16 14:30:00', 'scheduled', 'Post-op follow-up and mobility assessment'
  ),
  (
    (SELECT id FROM public.patients WHERE profile_id = '8b0d2e9c-8e8b-9c9d-5f8b-8d9e0f1a8888'),
    (SELECT id FROM public.professionals WHERE profile_id = '5c7d8e9f-5e5e-6f6a-3f5e-5a6b7c8d9999'),
    (SELECT id FROM public.locations WHERE name = 'City Hospital'),
    '1f3e9c5a-9c1f-4b2a-8c69-8e0a3f6a1111',
    '2025-12-17 10:30:00', '2025-12-17 11:15:00', 'scheduled', 'Blood pressure monitoring and medication review'
  );

-- End of demo data
