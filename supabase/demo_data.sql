-- Demo data for AI Powered Home Hospital Scheduling System
-- Run after you have created the tables (profiles, professionals, patients, locations, working_hours, schedules)

-- 1) Profiles (supervisor, coordinator, professionals, patients)
insert into public.profiles (id, full_name, phone, role) values
  ('1f3e9c5a-9c1f-4b2a-8c69-8e0a3f6a1111','Coordinator: Amina Chowdhury','+8801710000001','coordinator'),
  ('2b4d9d6b-2a2b-4f3b-9b2a-1e2f3a4b2222','Supervisor: Tanvir Hossain','+8801710000002','supervisor'),
  ('3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333','Dr. Janne Korpela','+358401234567','professional'),
  ('4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444','Nurse Maria Gomez','+8801710000004','professional'),
  ('5e7a9b9e-5d5e-6f6a-2f5e-5a6b7c8d5555','Patient: Fatima Rahman','+8801712345678','patient'),
  ('6f8b0cac-6e6f-7a7b-3f6f-6b7c8d9e6666','Patient: Mohammad Ali','+8801711122233','patient'),
  ('7a9c1dbd-7f7a-8b8c-4f7a-7c8d9e0f7777','Patient: Laila Begum','+8801712233445','patient');

-- 2) Professionals (link to profiles above)
insert into public.professionals (profile_id, kind, specialty) values
  ('3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333','doctor','Wound Care Specialist'),
  ('4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444','nurse','Community Nursing');

-- 3) Patients (some linked to profile, some without profile)
insert into public.patients (profile_id, name, phone, email, address) values
  ('5e7a9b9e-5d5e-6f6a-2f5e-5a6b7c8d5555','Fatima Rahman','+8801712345678','fatima.rahman@example.com','House 12, Dhaka'),
  ('6f8b0cac-6e6f-7a7b-3f6f-6b7c8d9e6666','Mohammad Ali','+8801711122233','mohammad.ali@example.com','House 34, Dhaka'),
  ('7a9c1dbd-7f7a-8b8c-4f7a-7c8d9e0f7777','Laila Begum','+8801712233445','laila.begum@example.com','House 56, Dhaka');

-- 4) Locations
insert into public.locations (name, address, type) values
  ('Home - Fatima','House 12, Dhaka','home'),
  ('Clinic - Central Health Center','123 Main Road, Dhaka','clinic');

-- 5) Working hours (recurring weekly shifts) -- use subselects to find professional ids
-- Dr. Janne: Mon-Fri 09:00-17:00
insert into public.working_hours (professional_id, weekday, start_time, end_time) values
  ((select id from public.professionals where profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'), 1, '09:00:00', '17:00:00'),
  ((select id from public.professionals where profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'), 2, '09:00:00', '17:00:00'),
  ((select id from public.professionals where profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'), 3, '09:00:00', '17:00:00'),
  ((select id from public.professionals where profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'), 4, '09:00:00', '17:00:00'),
  ((select id from public.professionals where profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'), 5, '09:00:00', '17:00:00');

-- Nurse Maria: Tue-Sat 08:00-16:00
insert into public.working_hours (professional_id, weekday, start_time, end_time) values
  ((select id from public.professionals where profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'), 2, '08:00:00', '16:00:00'),
  ((select id from public.professionals where profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'), 3, '08:00:00', '16:00:00'),
  ((select id from public.professionals where profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'), 4, '08:00:00', '16:00:00'),
  ((select id from public.professionals where profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'), 5, '08:00:00', '16:00:00'),
  ((select id from public.professionals where profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'), 6, '08:00:00', '16:00:00');

-- 6) Schedules / Visits (use subselects to find patient, professional and location ids)
-- Times use +06 offset (Bangladesh) for example; adjust as needed.
insert into public.schedules (patient_id, professional_id, assigned_by_profile, supervisor_profile, location_id, start_time, end_time, status, notes) values
  (
    (select id from public.patients where name = 'Fatima Rahman'),
    (select id from public.professionals where profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'),
    '1f3e9c5a-9c1f-4b2a-8c69-8e0a3f6a1111',
    '2b4d9d6b-2a2b-4f3b-9b2a-1e2f3a4b2222',
    (select id from public.locations where name = 'Home - Fatima'),
    '2025-11-10 09:00:00+06', '2025-11-10 09:45:00+06', 'scheduled', 'Initial wound assessment and dressing change'
  ),
  (
    (select id from public.patients where name = 'Mohammad Ali'),
    (select id from public.professionals where profile_id = '4d6f8a8d-4c4d-5e5f-1e4d-4f5c6d7e4444'),
    '1f3e9c5a-9c1f-4b2a-8c69-8e0a3f6a1111',
    '2b4d9d6b-2a2b-4f3b-9b2a-1e2f3a4b2222',
    (select id from public.locations where name = 'Clinic - Central Health Center'),
    '2025-11-11 14:00:00+06', '2025-11-11 14:30:00+06', 'scheduled', 'Follow-up blood pressure check'
  ),
  (
    (select id from public.patients where name = 'Laila Begum'),
    (select id from public.professionals where profile_id = '3c5e7f7c-3b3c-4c4d-0d3c-3f4b5c6d3333'),
    '1f3e9c5a-9c1f-4b2a-8c69-8e0a3f6a1111',
    '2b4d9d6b-2a2b-4f3b-9b2a-1e2f3a4b2222',
    (select id from public.locations where name = 'Home - Fatima'),
    '2025-11-12 10:30:00+06', '2025-11-12 11:00:00+06', 'scheduled', 'Vaccination visit'
  );

-- End of demo data
