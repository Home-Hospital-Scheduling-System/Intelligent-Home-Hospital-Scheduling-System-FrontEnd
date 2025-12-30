-- =====================================================
-- EXTENDED MOCK DATA: PRE-ASSIGNED PATIENTS WITH SCHEDULED VISITS
-- =====================================================
-- This script assigns 30 of the 50 patients to professionals
-- with scheduled visit dates and times
-- Leave 20 patients unassigned for testing the assignment workflow

-- Get today's date (we'll schedule visits starting from tomorrow)
-- The dates will be distributed across the week

-- =====================================================
-- INSERT PATIENT ASSIGNMENTS (30 of 50 patients)
-- =====================================================

-- We'll assign patients in batches:
-- - High Priority: 8 of 10 assigned
-- - Medium Priority: 17 of 25 assigned  
-- - Low Priority: 5 of 15 assigned
-- Total: 30 assigned, 20 unassigned

INSERT INTO patient_assignments (
  patient_id,
  professional_id,
  assigned_by_id,
  assignment_date,
  scheduled_visit_date,
  scheduled_visit_time,
  service_area,
  status,
  assignment_reason,
  match_score
) VALUES
-- HIGH PRIORITY PATIENTS (8 assigned)
-- Patient 1: Erkki Aaltonen - Wound Dressing - Keskusta
((SELECT id FROM patients WHERE name = 'Erkki Aaltonen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Wound Care Specialist' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '1 day',
 '09:00:00'::TIME,
 'Keskusta (City Center)',
 'active',
 'Specialized wound care needed daily. Best match for expertise.',
 95),

-- Patient 2: Maija Kemppainen - Palliative Care
((SELECT id FROM patients WHERE name = 'Maija Kemppainen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Palliative Care' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '1 day',
 '10:00:00'::TIME,
 'Keskusta (City Center)',
 'active',
 'Palliative care specialist for terminal care.',
 98),

-- Patient 3: Olavi Peltonen - Medication Administration - Raksila
((SELECT id FROM patients WHERE name = 'Olavi Peltonen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '2 days',
 '08:00:00'::TIME,
 'Raksila',
 'active',
 'IV antibiotic administration expertise required.',
 92),

-- Patient 4: Hilkka Savolainen - Post-operative Care - Tuira
((SELECT id FROM patients WHERE name = 'Hilkka Savolainen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Post-operative Care' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '1 day',
 '09:30:00'::TIME,
 'Tuira',
 'active',
 'Post-hip replacement care and physical therapy coordination.',
 94),

-- Patient 5: Veikko Laaksonen - Wound Dressing - Pohjois-Oulu
((SELECT id FROM patients WHERE name = 'Veikko Laaksonen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Wound Care Specialist' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '3 days',
 '09:00:00'::TIME,
 'Pohjois-Oulu',
 'active',
 'Diabetic ulcer care specialist.',
 93),

-- Patient 6: Aino Huttunen - Respiratory Care - Meri-Oulu
((SELECT id FROM patients WHERE name = 'Aino Huttunen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Respiratory Care' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '2 days',
 '10:00:00'::TIME,
 'Meri-Oulu',
 'active',
 'COPD patient requiring oxygen monitoring expertise.',
 90),

-- Patient 7: Tauno Karppinen - Medication Administration - Myllyoja
((SELECT id FROM patients WHERE name = 'Tauno Karppinen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '1 day',
 '14:00:00'::TIME,
 'Myllyoja',
 'active',
 'Chemotherapy support and side effect monitoring.',
 88),

-- Patient 8: Elsa Manninen - Palliative Care - Pateniemi
((SELECT id FROM patients WHERE name = 'Elsa Manninen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Palliative Care' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '2 days',
 '11:00:00'::TIME,
 'Pateniemi',
 'active',
 'End-of-life care and family support.',
 96),

-- MEDIUM PRIORITY PATIENTS (17 assigned, 8 unassigned)
-- Patient 11: Paavo Hietala - Nursing Care - Keskusta
((SELECT id FROM patients WHERE name = 'Paavo Hietala' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Elderly Care' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '3 days',
 '09:00:00'::TIME,
 'Keskusta (City Center)',
 'active',
 'Elderly care with mobility assistance.',
 85),

-- Patient 12: Raili Koivunen - Physical Therapy - Raksila
((SELECT id FROM patients WHERE name = 'Raili Koivunen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '4 days',
 '10:00:00'::TIME,
 'Raksila',
 'active',
 'Stroke rehabilitation therapy.',
 87),

-- Patient 13: Unto Laitinen - Medication Administration - Tuira
((SELECT id FROM patients WHERE name = 'Unto Laitinen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '5 days',
 '08:30:00'::TIME,
 'Tuira',
 'active',
 'Complex medication schedule management.',
 83),

-- Patient 14: Anneli Salminen - Home Health Aide - Pohjois-Oulu
((SELECT id FROM patients WHERE name = 'Anneli Salminen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Home Health Aide' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '4 days',
 '09:00:00'::TIME,
 'Pohjois-Oulu',
 'active',
 'Weekly vital signs monitoring.',
 80),

-- Patient 15: Eino Pajunen - Nursing Care - Pohjois-Oulu
((SELECT id FROM patients WHERE name = 'Eino Pajunen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Elderly Care' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '3 days',
 '10:30:00'::TIME,
 'Pohjois-Oulu',
 'active',
 'Dementia care support.',
 82),

-- Patient 16: Lempi Hakkarainen - Physical Therapy - Kontinkangas
((SELECT id FROM patients WHERE name = 'Lempi Hakkarainen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '6 days',
 '11:00:00'::TIME,
 'Kontinkangas',
 'active',
 'Knee replacement therapy exercises.',
 86),

-- Patient 17: Arvo Mikkola - Chronic Disease Management - Meri-Oulu
((SELECT id FROM patients WHERE name = 'Arvo Mikkola' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'doctor' AND specialty = 'General Practitioner' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '5 days',
 '13:00:00'::TIME,
 'Meri-Oulu',
 'active',
 'Diabetes management and monitoring.',
 89),

-- Patient 18: Helmi Tikkanen - Nursing Care - Pohjois-Oulu
((SELECT id FROM patients WHERE name = 'Helmi Tikkanen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Elderly Care' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '2 days',
 '14:30:00'::TIME,
 'Pohjois-Oulu',
 'active',
 'Post-stroke care coordination.',
 84),

-- Patient 19: Toivo Räsänen - Wound Dressing - Myllyoja
((SELECT id FROM patients WHERE name = 'Toivo Räsänen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Wound Care Specialist' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '4 days',
 '10:00:00'::TIME,
 'Myllyoja',
 'active',
 'Leg ulcer compression bandage application.',
 88),

-- Patient 20: Martta Kettunen - Medication Administration - Pohjois-Oulu
((SELECT id FROM patients WHERE name = 'Martta Kettunen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '3 days',
 '09:00:00'::TIME,
 'Pohjois-Oulu',
 'active',
 'Heart medication monitoring and edema checks.',
 85),

-- Patient 21: Viljo Heikkilä - Physical Therapy - Pohjois-Oulu
((SELECT id FROM patients WHERE name = 'Viljo Heikkilä' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '5 days',
 '09:30:00'::TIME,
 'Pohjois-Oulu',
 'active',
 'Back injury core strengthening exercises.',
 81),

-- Patient 22: Saima Koponen - Home Health Aide - Kaakkuri
((SELECT id FROM patients WHERE name = 'Saima Koponen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Home Health Aide' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '6 days',
 '10:00:00'::TIME,
 'Kaakkuri',
 'active',
 'Weekly wellness checks.',
 78),

-- Patient 23: Kalle Mustonen - Nursing Care - Meri-Oulu
((SELECT id FROM patients WHERE name = 'Kalle Mustonen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '2 days',
 '13:00:00'::TIME,
 'Meri-Oulu',
 'active',
 'Catheter care and infection monitoring.',
 83),

-- Patient 24: Tyyne Pesonen - Chronic Disease Management - Kaakkuri
((SELECT id FROM patients WHERE name = 'Tyyne Pesonen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'doctor' AND specialty = 'Internal Medicine' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '7 days',
 '14:00:00'::TIME,
 'Kaakkuri',
 'active',
 'Hypertension management.',
 86),

-- Patient 25: Eero Virtanen - Physical Therapy - Kaakkuri
((SELECT id FROM patients WHERE name = 'Eero Virtanen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '4 days',
 '11:00:00'::TIME,
 'Kaakkuri',
 'active',
 'Arthritis joint mobility therapy.',
 79),

-- Patient 26: Helvi Laakso - Nursing Care - Pohjois-Oulu
((SELECT id FROM patients WHERE name = 'Helvi Laakso' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Elderly Care' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '3 days',
 '08:00:00'::TIME,
 'Pohjois-Oulu',
 'active',
 'Daily living assistance and bathing help.',
 84),

-- Patient 27: Onni Turunen - Medication Administration - Meri-Oulu
((SELECT id FROM patients WHERE name = 'Onni Turunen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '5 days',
 '10:30:00'::TIME,
 'Meri-Oulu',
 'active',
 'Parkinson medication management.',
 81),

-- Patient 28: Kaarina Niskanen - Home Health Aide - Pohjois-Oulu
((SELECT id FROM patients WHERE name = 'Kaarina Niskanen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Home Health Aide' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '6 days',
 '09:00:00'::TIME,
 'Pohjois-Oulu',
 'active',
 'Weekly health assessment.',
 77),

-- LOW PRIORITY PATIENTS (5 assigned, 10 unassigned)
-- Patient 36: Sylvi Lehtinen - Home Visit General Checkup - Keskusta
((SELECT id FROM patients WHERE name = 'Sylvi Lehtinen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '7 days',
 '10:00:00'::TIME,
 'Keskusta (City Center)',
 'active',
 'Monthly wellness check.',
 70),

-- Patient 37: Pentti Jokinen - Chronic Disease Management - Raksila
((SELECT id FROM patients WHERE name = 'Pentti Jokinen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'doctor' AND specialty = 'General Practitioner' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '8 days',
 '11:00:00'::TIME,
 'Raksila',
 'active',
 'Stable diabetes follow-up.',
 72),

-- Patient 38: Mirja Ahola - Home Visit Medication Management - Tuira
((SELECT id FROM patients WHERE name = 'Mirja Ahola' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '5 days',
 '14:00:00'::TIME,
 'Tuira',
 'active',
 'Medication review and pill organizer check.',
 68),

-- Patient 39: Kalervo Niemelä - Home Visit General Checkup - Pohjois-Oulu
((SELECT id FROM patients WHERE name = 'Kalervo Niemelä' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '9 days',
 '09:30:00'::TIME,
 'Pohjois-Oulu',
 'active',
 'Annual preventive care assessment.',
 65),

-- Patient 40: Aili Partanen - Nursing Care - Pohjois-Oulu
((SELECT id FROM patients WHERE name = 'Aili Partanen' LIMIT 1),
 (SELECT id FROM professionals WHERE kind = 'nurse' AND specialty = 'Elderly Care' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'professional' LIMIT 1),
 NOW(),
 CURRENT_DATE + INTERVAL '6 days',
 '14:30:00'::TIME,
 'Pohjois-Oulu',
 'active',
 'Companion care and social interaction visits.',
 73)

ON CONFLICT DO NOTHING;

-- Update professional patient counts
UPDATE professionals 
SET current_patient_count = (
  SELECT COUNT(*) FROM patient_assignments 
  WHERE professional_id = professionals.id AND status = 'active'
)
WHERE id IN (SELECT DISTINCT professional_id FROM patient_assignments WHERE status = 'active');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

SELECT '=== PATIENT ASSIGNMENT SUMMARY ===' as info;

SELECT 'Total assignments created:' as info;
SELECT COUNT(*) as total_assignments FROM patient_assignments WHERE status = 'active';

SELECT 'Assignments by professional:' as info;
SELECT 
  p.id,
  prof.full_name,
  COUNT(pa.id) as patient_count,
  pr.kind
FROM patient_assignments pa
JOIN professionals p ON pa.professional_id = p.id
JOIN profiles prof ON p.profile_id = prof.id
JOIN professionals pr ON pr.id = p.id
WHERE pa.status = 'active'
GROUP BY p.id, prof.full_name, pr.kind
ORDER BY patient_count DESC;

SELECT 'Upcoming visits (next 7 days):' as info;
SELECT 
  patient_name,
  professional_name,
  scheduled_visit_date,
  scheduled_visit_time,
  service_area
FROM (
  SELECT 
    pt.name as patient_name,
    prof.full_name as professional_name,
    pa.scheduled_visit_date,
    pa.scheduled_visit_time,
    pa.service_area
  FROM patient_assignments pa
  JOIN patients pt ON pa.patient_id = pt.id
  JOIN professionals p ON pa.professional_id = p.id
  JOIN profiles prof ON p.profile_id = prof.id
  WHERE pa.status = 'active'
    AND pa.scheduled_visit_date <= CURRENT_DATE + INTERVAL '7 days'
    AND pa.scheduled_visit_date >= CURRENT_DATE
) scheduled_visits
ORDER BY scheduled_visit_date, scheduled_visit_time;

SELECT 'Unassigned patients (20):' as info;
SELECT 
  name,
  area,
  care_needed
FROM patients
WHERE id NOT IN (
  SELECT DISTINCT patient_id FROM patient_assignments WHERE status = 'active'
)
ORDER BY name;

SELECT '=== ASSIGNMENT DATA LOADED SUCCESSFULLY ===' as info;
