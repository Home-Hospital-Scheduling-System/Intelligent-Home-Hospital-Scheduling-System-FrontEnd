-- =====================================================
-- COMPLETE MOCK DATA FOR HOME HOSPITAL SCHEDULING SYSTEM
-- 25 Professionals (15 Nurses + 10 Doctors) + 50 Patients
-- =====================================================
-- This script works with the schema:
-- - profiles: id (UUID), full_name, email, phone, role
-- - professionals: id (SERIAL), profile_id (UUID FK), kind, specialty, license_number
-- - patients: id (SERIAL), name, phone, email, address, area, care_needed, medical_notes, profile_id

-- =====================================================
-- PART 0: ADD PATIENT VISIT TIME COLUMNS (MIGRATION)
-- =====================================================
-- This adds the columns needed for visit time preferences

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS preferred_visit_time TIME,
ADD COLUMN IF NOT EXISTS visit_time_flexibility VARCHAR(50) DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS visit_notes TEXT;

-- Remove old constraint if it exists with different values
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_visit_time_flexibility_check;

-- Add updated constraint
ALTER TABLE patients ADD CONSTRAINT patients_visit_time_flexibility_check 
CHECK (visit_time_flexibility IN ('strict', 'flexible', 'very_flexible'));

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_preferred_visit_time ON patients(preferred_visit_time);
CREATE INDEX IF NOT EXISTS idx_patients_visit_flexibility ON patients(visit_time_flexibility);

-- =====================================================
-- PART 1: INSERT PROFILES FOR 25 PROFESSIONALS
-- =====================================================

INSERT INTO profiles (id, full_name, email, phone, role) VALUES
-- Nurses (15)
('a1000001-0001-0001-0001-000000000001', 'Anna Korhonen', 'anna.korhonen@hospital.fi', '+358401234501', 'professional'),
('a1000001-0001-0001-0001-000000000002', 'Mikko Virtanen', 'mikko.virtanen@hospital.fi', '+358401234502', 'professional'),
('a1000001-0001-0001-0001-000000000003', 'Sari Mäkinen', 'sari.makinen@hospital.fi', '+358401234503', 'professional'),
('a1000001-0001-0001-0001-000000000004', 'Jukka Nieminen', 'jukka.nieminen@hospital.fi', '+358401234504', 'professional'),
('a1000001-0001-0001-0001-000000000005', 'Maria Hämäläinen', 'maria.hamalainen@hospital.fi', '+358401234505', 'professional'),
('a1000001-0001-0001-0001-000000000006', 'Petri Laine', 'petri.laine@hospital.fi', '+358401234506', 'professional'),
('a1000001-0001-0001-0001-000000000007', 'Liisa Heikkinen', 'liisa.heikkinen@hospital.fi', '+358401234507', 'professional'),
('a1000001-0001-0001-0001-000000000008', 'Timo Koskinen', 'timo.koskinen@hospital.fi', '+358401234508', 'professional'),
('a1000001-0001-0001-0001-000000000009', 'Eeva Järvinen', 'eeva.jarvinen@hospital.fi', '+358401234509', 'professional'),
('a1000001-0001-0001-0001-000000000010', 'Antti Lehtonen', 'antti.lehtonen@hospital.fi', '+358401234510', 'professional'),
('a1000001-0001-0001-0001-000000000011', 'Katja Saarinen', 'katja.saarinen@hospital.fi', '+358401234511', 'professional'),
('a1000001-0001-0001-0001-000000000012', 'Markku Lahtinen', 'markku.lahtinen@hospital.fi', '+358401234512', 'professional'),
('a1000001-0001-0001-0001-000000000013', 'Helena Rantanen', 'helena.rantanen@hospital.fi', '+358401234513', 'professional'),
('a1000001-0001-0001-0001-000000000014', 'Ville Karjalainen', 'ville.karjalainen@hospital.fi', '+358401234514', 'professional'),
('a1000001-0001-0001-0001-000000000015', 'Johanna Ojala', 'johanna.ojala@hospital.fi', '+358401234515', 'professional'),
-- Doctors (10)
('a1000001-0001-0001-0001-000000000016', 'Dr. Pekka Laaksonen', 'pekka.laaksonen@hospital.fi', '+358401234516', 'professional'),
('a1000001-0001-0001-0001-000000000017', 'Dr. Tuula Ahonen', 'tuula.ahonen@hospital.fi', '+358401234517', 'professional'),
('a1000001-0001-0001-0001-000000000018', 'Dr. Matti Salonen', 'matti.salonen@hospital.fi', '+358401234518', 'professional'),
('a1000001-0001-0001-0001-000000000019', 'Dr. Kirsi Tuominen', 'kirsi.tuominen@hospital.fi', '+358401234519', 'professional'),
('a1000001-0001-0001-0001-000000000020', 'Dr. Hannu Lindqvist', 'hannu.lindqvist@hospital.fi', '+358401234520', 'professional'),
('a1000001-0001-0001-0001-000000000021', 'Dr. Päivi Mattila', 'paivi.mattila@hospital.fi', '+358401234521', 'professional'),
('a1000001-0001-0001-0001-000000000022', 'Dr. Juha Koivisto', 'juha.koivisto@hospital.fi', '+358401234522', 'professional'),
('a1000001-0001-0001-0001-000000000023', 'Dr. Leena Salo', 'leena.salo@hospital.fi', '+358401234523', 'professional'),
('a1000001-0001-0001-0001-000000000024', 'Dr. Kari Leppänen', 'kari.leppanen@hospital.fi', '+358401234524', 'professional'),
('a1000001-0001-0001-0001-000000000025', 'Dr. Riitta Hakala', 'riitta.hakala@hospital.fi', '+358401234525', 'professional')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- PART 2: INSERT 25 PROFESSIONALS (linked to profiles)
-- =====================================================

-- First check if professionals already exist, only insert new ones
INSERT INTO professionals (profile_id, kind, specialty, license_number)
SELECT * FROM (VALUES
-- Nurses (15)
('a1000001-0001-0001-0001-000000000001'::UUID, 'nurse', 'Wound Care Specialist', 'NUR-2024-001'),
('a1000001-0001-0001-0001-000000000002'::UUID, 'nurse', 'Community Nursing', 'NUR-2024-002'),
('a1000001-0001-0001-0001-000000000003'::UUID, 'nurse', 'Geriatric Care', 'NUR-2024-003'),
('a1000001-0001-0001-0001-000000000004'::UUID, 'nurse', 'IV Therapy Specialist', 'NUR-2024-004'),
('a1000001-0001-0001-0001-000000000005'::UUID, 'nurse', 'Palliative Care', 'NUR-2024-005'),
('a1000001-0001-0001-0001-000000000006'::UUID, 'nurse', 'Rehabilitation Nursing', 'NUR-2024-006'),
('a1000001-0001-0001-0001-000000000007'::UUID, 'nurse', 'Cardiac Care', 'NUR-2024-007'),
('a1000001-0001-0001-0001-000000000008'::UUID, 'nurse', 'Diabetic Care', 'NUR-2024-008'),
('a1000001-0001-0001-0001-000000000009'::UUID, 'nurse', 'Respiratory Care', 'NUR-2024-009'),
('a1000001-0001-0001-0001-000000000010'::UUID, 'nurse', 'Home Health Aide', 'NUR-2024-010'),
('a1000001-0001-0001-0001-000000000011'::UUID, 'nurse', 'Wound Care Specialist', 'NUR-2024-011'),
('a1000001-0001-0001-0001-000000000012'::UUID, 'nurse', 'Post-operative Care', 'NUR-2024-012'),
('a1000001-0001-0001-0001-000000000013'::UUID, 'nurse', 'Chronic Disease Management', 'NUR-2024-013'),
('a1000001-0001-0001-0001-000000000014'::UUID, 'nurse', 'Medication Administration', 'NUR-2024-014'),
('a1000001-0001-0001-0001-000000000015'::UUID, 'nurse', 'Elderly Care', 'NUR-2024-015'),
-- Doctors (10)
('a1000001-0001-0001-0001-000000000016'::UUID, 'doctor', 'General Practitioner', 'DOC-2024-001'),
('a1000001-0001-0001-0001-000000000017'::UUID, 'doctor', 'Internal Medicine', 'DOC-2024-002'),
('a1000001-0001-0001-0001-000000000018'::UUID, 'doctor', 'Geriatrics', 'DOC-2024-003'),
('a1000001-0001-0001-0001-000000000019'::UUID, 'doctor', 'Palliative Medicine', 'DOC-2024-004'),
('a1000001-0001-0001-0001-000000000020'::UUID, 'doctor', 'Cardiology', 'DOC-2024-005'),
('a1000001-0001-0001-0001-000000000021'::UUID, 'doctor', 'Pulmonology', 'DOC-2024-006'),
('a1000001-0001-0001-0001-000000000022'::UUID, 'doctor', 'Wound Care Specialist', 'DOC-2024-007'),
('a1000001-0001-0001-0001-000000000023'::UUID, 'doctor', 'Rehabilitation Medicine', 'DOC-2024-008'),
('a1000001-0001-0001-0001-000000000024'::UUID, 'doctor', 'Endocrinology', 'DOC-2024-009'),
('a1000001-0001-0001-0001-000000000025'::UUID, 'doctor', 'Family Medicine', 'DOC-2024-010')
) AS v(profile_id, kind, specialty, license_number)
WHERE NOT EXISTS (SELECT 1 FROM professionals p WHERE p.profile_id = v.profile_id);

-- =====================================================
-- PART 3: INSERT PROFILES FOR 50 PATIENTS
-- =====================================================

INSERT INTO profiles (id, full_name, email, phone, role) VALUES
-- High Priority Patients (10)
('b2000001-0001-0001-0001-000000000001', 'Erkki Aaltonen', 'erkki.aaltonen@email.fi', '+358501111001', 'patient'),
('b2000001-0001-0001-0001-000000000002', 'Maija Kemppainen', 'maija.kemppainen@email.fi', '+358501111002', 'patient'),
('b2000001-0001-0001-0001-000000000003', 'Olavi Peltonen', 'olavi.peltonen@email.fi', '+358501111003', 'patient'),
('b2000001-0001-0001-0001-000000000004', 'Hilkka Savolainen', 'hilkka.savolainen@email.fi', '+358501111004', 'patient'),
('b2000001-0001-0001-0001-000000000005', 'Veikko Laaksonen', 'veikko.laaksonen@email.fi', '+358501111005', 'patient'),
('b2000001-0001-0001-0001-000000000006', 'Aino Huttunen', 'aino.huttunen@email.fi', '+358501111006', 'patient'),
('b2000001-0001-0001-0001-000000000007', 'Tauno Karppinen', 'tauno.karppinen@email.fi', '+358501111007', 'patient'),
('b2000001-0001-0001-0001-000000000008', 'Elsa Manninen', 'elsa.manninen@email.fi', '+358501111008', 'patient'),
('b2000001-0001-0001-0001-000000000009', 'Kauko Vesterinen', 'kauko.vesterinen@email.fi', '+358501111009', 'patient'),
('b2000001-0001-0001-0001-000000000010', 'Siiri Kuusela', 'siiri.kuusela@email.fi', '+358501111010', 'patient'),
-- Medium Priority Patients (25)
('b2000001-0001-0001-0001-000000000011', 'Paavo Hietala', 'paavo.hietala@email.fi', '+358501111011', 'patient'),
('b2000001-0001-0001-0001-000000000012', 'Raili Koivunen', 'raili.koivunen@email.fi', '+358501111012', 'patient'),
('b2000001-0001-0001-0001-000000000013', 'Unto Laitinen', 'unto.laitinen@email.fi', '+358501111013', 'patient'),
('b2000001-0001-0001-0001-000000000014', 'Anneli Salminen', 'anneli.salminen@email.fi', '+358501111014', 'patient'),
('b2000001-0001-0001-0001-000000000015', 'Eino Pajunen', 'eino.pajunen@email.fi', '+358501111015', 'patient'),
('b2000001-0001-0001-0001-000000000016', 'Lempi Hakkarainen', 'lempi.hakkarainen@email.fi', '+358501111016', 'patient'),
('b2000001-0001-0001-0001-000000000017', 'Arvo Mikkola', 'arvo.mikkola@email.fi', '+358501111017', 'patient'),
('b2000001-0001-0001-0001-000000000018', 'Helmi Tikkanen', 'helmi.tikkanen@email.fi', '+358501111018', 'patient'),
('b2000001-0001-0001-0001-000000000019', 'Toivo Räsänen', 'toivo.rasanen@email.fi', '+358501111019', 'patient'),
('b2000001-0001-0001-0001-000000000020', 'Martta Kettunen', 'martta.kettunen@email.fi', '+358501111020', 'patient'),
('b2000001-0001-0001-0001-000000000021', 'Viljo Heikkilä', 'viljo.heikkila@email.fi', '+358501111021', 'patient'),
('b2000001-0001-0001-0001-000000000022', 'Saima Koponen', 'saima.koponen@email.fi', '+358501111022', 'patient'),
('b2000001-0001-0001-0001-000000000023', 'Kalle Mustonen', 'kalle.mustonen@email.fi', '+358501111023', 'patient'),
('b2000001-0001-0001-0001-000000000024', 'Tyyne Pesonen', 'tyyne.pesonen@email.fi', '+358501111024', 'patient'),
('b2000001-0001-0001-0001-000000000025', 'Eero Virtanen', 'eero.virtanen@email.fi', '+358501111025', 'patient'),
('b2000001-0001-0001-0001-000000000026', 'Helvi Laakso', 'helvi.laakso@email.fi', '+358501111026', 'patient'),
('b2000001-0001-0001-0001-000000000027', 'Onni Turunen', 'onni.turunen@email.fi', '+358501111027', 'patient'),
('b2000001-0001-0001-0001-000000000028', 'Kaarina Niskanen', 'kaarina.niskanen@email.fi', '+358501111028', 'patient'),
('b2000001-0001-0001-0001-000000000029', 'Lauri Kinnunen', 'lauri.kinnunen@email.fi', '+358501111029', 'patient'),
('b2000001-0001-0001-0001-000000000030', 'Alli Valtonen', 'alli.valtonen@email.fi', '+358501111030', 'patient'),
('b2000001-0001-0001-0001-000000000031', 'Urho Rissanen', 'urho.rissanen@email.fi', '+358501111031', 'patient'),
('b2000001-0001-0001-0001-000000000032', 'Inkeri Heinonen', 'inkeri.heinonen@email.fi', '+358501111032', 'patient'),
('b2000001-0001-0001-0001-000000000033', 'Reino Toivonen', 'reino.toivonen@email.fi', '+358501111033', 'patient'),
('b2000001-0001-0001-0001-000000000034', 'Terttu Miettinen', 'terttu.miettinen@email.fi', '+358501111034', 'patient'),
('b2000001-0001-0001-0001-000000000035', 'Aarne Hiltunen', 'aarne.hiltunen@email.fi', '+358501111035', 'patient'),
-- Low Priority Patients (15)
('b2000001-0001-0001-0001-000000000036', 'Sylvi Lehtinen', 'sylvi.lehtinen@email.fi', '+358501111036', 'patient'),
('b2000001-0001-0001-0001-000000000037', 'Pentti Jokinen', 'pentti.jokinen@email.fi', '+358501111037', 'patient'),
('b2000001-0001-0001-0001-000000000038', 'Mirja Ahola', 'mirja.ahola@email.fi', '+358501111038', 'patient'),
('b2000001-0001-0001-0001-000000000039', 'Kalervo Niemelä', 'kalervo.niemela@email.fi', '+358501111039', 'patient'),
('b2000001-0001-0001-0001-000000000040', 'Aili Partanen', 'aili.partanen@email.fi', '+358501111040', 'patient'),
('b2000001-0001-0001-0001-000000000041', 'Mauno Karhu', 'mauno.karhu@email.fi', '+358501111041', 'patient'),
('b2000001-0001-0001-0001-000000000042', 'Vieno Mäkelä', 'vieno.makela@email.fi', '+358501111042', 'patient'),
('b2000001-0001-0001-0001-000000000043', 'Einari Korhonen', 'einari.korhonen@email.fi', '+358501111043', 'patient'),
('b2000001-0001-0001-0001-000000000044', 'Kerttu Leppänen', 'kerttu.leppanen@email.fi', '+358501111044', 'patient'),
('b2000001-0001-0001-0001-000000000045', 'Väinö Hyvärinen', 'vaino.hyvarinen@email.fi', '+358501111045', 'patient'),
('b2000001-0001-0001-0001-000000000046', 'Sirkka Pulkkinen', 'sirkka.pulkkinen@email.fi', '+358501111046', 'patient'),
('b2000001-0001-0001-0001-000000000047', 'Taavi Kallio', 'taavi.kallio@email.fi', '+358501111047', 'patient'),
('b2000001-0001-0001-0001-000000000048', 'Hilma Seppänen', 'hilma.seppanen@email.fi', '+358501111048', 'patient'),
('b2000001-0001-0001-0001-000000000049', 'Armas Pitkänen', 'armas.pitkanen@email.fi', '+358501111049', 'patient'),
('b2000001-0001-0001-0001-000000000050', 'Lyyli Eskola', 'lyyli.eskola@email.fi', '+358501111050', 'patient')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- PART 4: INSERT 50 PATIENTS (linked to profiles)
-- with preferred visit times and flexibility settings
-- =====================================================

INSERT INTO patients (profile_id, name, phone, email, address, area, care_needed, medical_notes, preferred_visit_time, visit_time_flexibility, visit_notes) VALUES
-- High Priority Patients (10) - mostly strict or flexible timing
('b2000001-0001-0001-0001-000000000001', 'Erkki Aaltonen', '+358501111001', 'erkki.aaltonen@email.fi', 'Hallituskatu 12 A 5, Oulu', 'Keskusta (City Center)', 'Wound Dressing', 'Post-surgical wound care needed twice daily. Diabetic patient.', '08:00', 'strict', 'Morning visits preferred due to insulin schedule. Must be before 09:00.'),
('b2000001-0001-0001-0001-000000000002', 'Maija Kemppainen', '+358501111002', 'maija.kemppainen@email.fi', 'Torikatu 8 B 3, Oulu', 'Keskusta (City Center)', 'Palliative Care', 'Terminal cancer patient requiring pain management and comfort care.', '10:00', 'flexible', 'Family visits in afternoons, prefer morning medical visits.'),
('b2000001-0001-0001-0001-000000000003', 'Olavi Peltonen', '+358501111003', 'olavi.peltonen@email.fi', 'Raksilan puistotie 15, Oulu', 'Raksila', 'Medication Administration', 'Daily IV antibiotics for infection. Requires professional administration.', '09:00', 'strict', 'IV medication must be given at consistent times.'),
('b2000001-0001-0001-0001-000000000004', 'Hilkka Savolainen', '+358501111004', 'hilkka.savolainen@email.fi', 'Tuiran rantatie 22, Oulu', 'Tuira', 'Post-operative Care', 'Hip replacement recovery. Needs physical therapy and wound monitoring.', '11:00', 'flexible', 'Prefers late morning after morning routine.'),
('b2000001-0001-0001-0001-000000000005', 'Veikko Laaksonen', '+358501111005', 'veikko.laaksonen@email.fi', 'Koskelantie 45, Oulu', 'Pohjois-Oulu', 'Wound Dressing', 'Diabetic foot ulcer treatment. Check blood sugar levels.', '08:30', 'strict', 'Must be early morning before breakfast for blood sugar check.'),
('b2000001-0001-0001-0001-000000000006', 'Aino Huttunen', '+358501111006', 'aino.huttunen@email.fi', 'Oulunsalontie 67, Oulu', 'Meri-Oulu', 'Respiratory Care', 'COPD patient requiring oxygen monitoring and breathing exercises.', '09:30', 'flexible', 'Morning preferred, needs time for breathing exercises after.'),
('b2000001-0001-0001-0001-000000000007', 'Tauno Karppinen', '+358501111007', 'tauno.karppinen@email.fi', 'Myllyojan puistotie 8, Oulu', 'Myllyoja', 'Medication Administration', 'Chemotherapy support at home. Monitor for side effects.', '10:00', 'strict', 'Chemo timing critical. Must be 10:00 exactly.'),
('b2000001-0001-0001-0001-000000000008', 'Elsa Manninen', '+358501111008', 'elsa.manninen@email.fi', 'Pateniementie 34, Oulu', 'Pateniemi', 'Palliative Care', 'End-of-life care. Focus on comfort measures and family support.', '14:00', 'very_flexible', 'Afternoon preferred when family is present. Flexible timing.'),
('b2000001-0001-0001-0001-000000000009', 'Kauko Vesterinen', '+358501111009', 'kauko.vesterinen@email.fi', 'Kaakkurintie 19, Oulu', 'Kaakkuri', 'Wound Dressing', 'Severe pressure ulcer treatment. Needs repositioning guidance.', '09:00', 'flexible', 'Morning visits work best. Needs help with repositioning.'),
('b2000001-0001-0001-0001-000000000010', 'Siiri Kuusela', '+358501111010', 'siiri.kuusela@email.fi', 'Linnanmaantie 88, Oulu', 'Kontinkangas', 'Post-operative Care', 'Cardiac surgery recovery. Monitor vital signs daily.', '07:30', 'strict', 'Early morning vital check required. Strict timing for medication.'),

-- Medium Priority Patients (25) - mix of flexible and very_flexible
('b2000001-0001-0001-0001-000000000011', 'Paavo Hietala', '+358501111011', 'paavo.hietala@email.fi', 'Keskustie 5, Oulu', 'Keskusta (City Center)', 'Nursing Care', 'Elderly care. Needs mobility assistance and medication reminders.', '10:00', 'flexible', 'Late morning preferred after breakfast.'),
('b2000001-0001-0001-0001-000000000012', 'Raili Koivunen', '+358501111012', 'raili.koivunen@email.fi', 'Raksilan puistotie 28, Oulu', 'Raksila', 'Physical Therapy', 'Stroke rehabilitation. Focus on left side mobility exercises.', '11:00', 'flexible', 'Mid-morning when energy is highest.'),
('b2000001-0001-0001-0001-000000000013', 'Unto Laitinen', '+358501111013', 'unto.laitinen@email.fi', 'Tuirantie 15, Oulu', 'Tuira', 'Medication Administration', 'Multiple chronic conditions. Complex medication schedule.', '08:00', 'strict', 'Morning medications must be on time.'),
('b2000001-0001-0001-0001-000000000014', 'Anneli Salminen', '+358501111014', 'anneli.salminen@email.fi', 'Kastellintie 7, Oulu', 'Pohjois-Oulu', 'Home Health Aide', 'General health monitoring. Weekly vital signs check.', '13:00', 'very_flexible', 'Afternoon works best. Very flexible with timing.'),
('b2000001-0001-0001-0001-000000000015', 'Eino Pajunen', '+358501111015', 'eino.pajunen@email.fi', 'Höyhtyäntie 33, Oulu', 'Pohjois-Oulu', 'Nursing Care', 'Dementia care support. Patient may be confused at times.', '10:30', 'flexible', 'Late morning when patient is most alert.'),
('b2000001-0001-0001-0001-000000000016', 'Lempi Hakkarainen', '+358501111016', 'lempi.hakkarainen@email.fi', 'Kaijonharjuntie 12, Oulu', 'Kontinkangas', 'Physical Therapy', 'Knee replacement therapy. Strengthen quadriceps.', '09:00', 'flexible', 'Morning therapy sessions preferred.'),
('b2000001-0001-0001-0001-000000000017', 'Arvo Mikkola', '+358501111017', 'arvo.mikkola@email.fi', 'Oulunsalontie 89, Oulu', 'Meri-Oulu', 'Chronic Disease Management', 'Diabetes management. A1C monitoring and diet counseling.', '08:30', 'strict', 'Fasting required - must be before breakfast.'),
('b2000001-0001-0001-0001-000000000018', 'Helmi Tikkanen', '+358501111018', 'helmi.tikkanen@email.fi', 'Pyykösjärventie 45, Oulu', 'Pohjois-Oulu', 'Nursing Care', 'Post-stroke care. Speech therapy recommended.', '14:00', 'flexible', 'Afternoon when more rested.'),
('b2000001-0001-0001-0001-000000000019', 'Toivo Räsänen', '+358501111019', 'toivo.rasanen@email.fi', 'Maikkulantie 23, Oulu', 'Myllyoja', 'Wound Dressing', 'Leg ulcer treatment. Apply compression bandages.', '09:30', 'flexible', 'Morning preferred for bandage changes.'),
('b2000001-0001-0001-0001-000000000020', 'Martta Kettunen', '+358501111020', 'martta.kettunen@email.fi', 'Korvensuorantie 67, Oulu', 'Pohjois-Oulu', 'Medication Administration', 'Heart medication monitoring. Check for edema.', '08:00', 'strict', 'Morning medication schedule is critical.'),
('b2000001-0001-0001-0001-000000000021', 'Viljo Heikkilä', '+358501111021', 'viljo.heikkila@email.fi', 'Ritaharjuntie 11, Oulu', 'Pohjois-Oulu', 'Physical Therapy', 'Back injury rehabilitation. Core strengthening exercises.', '11:00', 'very_flexible', 'Any time works, prefers late morning.'),
('b2000001-0001-0001-0001-000000000022', 'Saima Koponen', '+358501111022', 'saima.koponen@email.fi', 'Hiukkavaarantie 56, Oulu', 'Kaakkuri', 'Home Health Aide', 'Wellness checks. Loneliness monitoring.', '15:00', 'very_flexible', 'Afternoon social visits preferred.'),
('b2000001-0001-0001-0001-000000000023', 'Kalle Mustonen', '+358501111023', 'kalle.mustonen@email.fi', 'Toppilansaarentie 8, Oulu', 'Meri-Oulu', 'Nursing Care', 'Catheter care. Monitor for infections.', '09:00', 'flexible', 'Morning care routine.'),
('b2000001-0001-0001-0001-000000000024', 'Tyyne Pesonen', '+358501111024', 'tyyne.pesonen@email.fi', 'Herukantie 34, Oulu', 'Kaakkuri', 'Chronic Disease Management', 'Hypertension management. Daily BP monitoring.', '08:00', 'flexible', 'Morning BP check preferred.'),
('b2000001-0001-0001-0001-000000000025', 'Eero Virtanen', '+358501111025', 'eero.virtanen@email.fi', 'Talvikankantie 78, Oulu', 'Kaakkuri', 'Physical Therapy', 'Arthritis therapy. Joint mobility exercises.', '10:00', 'flexible', 'Mid-morning when joints are warmed up.'),
('b2000001-0001-0001-0001-000000000026', 'Helvi Laakso', '+358501111026', 'helvi.laakso@email.fi', 'Knuutilankangantie 19, Oulu', 'Pohjois-Oulu', 'Nursing Care', 'Daily living assistance. Bathing and dressing help.', '08:30', 'flexible', 'Morning care assistance.'),
('b2000001-0001-0001-0001-000000000027', 'Onni Turunen', '+358501111027', 'onni.turunen@email.fi', 'Sanginsuu puistotie 5, Oulu', 'Meri-Oulu', 'Medication Administration', 'Parkinson medication. Monitor for tremors.', '09:00', 'strict', 'Parkinson meds must be on strict schedule.'),
('b2000001-0001-0001-0001-000000000028', 'Kaarina Niskanen', '+358501111028', 'kaarina.niskanen@email.fi', 'Madekoskentie 42, Oulu', 'Pohjois-Oulu', 'Home Health Aide', 'Weekly health assessment. Blood pressure and weight.', '14:00', 'very_flexible', 'Any afternoon works well.'),
('b2000001-0001-0001-0001-000000000029', 'Lauri Kinnunen', '+358501111029', 'lauri.kinnunen@email.fi', 'Pikkaralan puistotie 16, Oulu', 'Pohjois-Oulu', 'Chronic Disease Management', 'COPD monitoring. Oxygen saturation checks.', '10:00', 'flexible', 'Late morning preferred.'),
('b2000001-0001-0001-0001-000000000030', 'Alli Valtonen', '+358501111030', 'alli.valtonen@email.fi', 'Oulunlahden puistotie 29, Oulu', 'Meri-Oulu', 'Nursing Care', 'Wound dressing changes. Surgical site healing.', '09:30', 'flexible', 'Morning dressing changes.'),
('b2000001-0001-0001-0001-000000000031', 'Urho Rissanen', '+358501111031', 'urho.rissanen@email.fi', 'Puolivälinkangas tie 8, Oulu', 'Kontinkangas', 'Physical Therapy', 'Hip mobility exercises. Fall prevention.', '11:00', 'flexible', 'Late morning exercise sessions.'),
('b2000001-0001-0001-0001-000000000032', 'Inkeri Heinonen', '+358501111032', 'inkeri.heinonen@email.fi', 'Kontinkangas sairaala-alue 3, Oulu', 'Kontinkangas', 'Medication Administration', 'Post-hospital medication. Review discharge instructions.', '08:30', 'flexible', 'Morning medication review.'),
('b2000001-0001-0001-0001-000000000033', 'Reino Toivonen', '+358501111033', 'reino.toivonen@email.fi', 'Alppilantie 55, Oulu', 'Keskusta (City Center)', 'Chronic Disease Management', 'Cardiac monitoring. ECG as needed.', '09:00', 'flexible', 'Morning cardiac checks.'),
('b2000001-0001-0001-0001-000000000034', 'Terttu Miettinen', '+358501111034', 'terttu.miettinen@email.fi', 'Intiöntie 21, Oulu', 'Keskusta (City Center)', 'Nursing Care', 'Diabetic foot care. Inspect feet daily.', '10:00', 'flexible', 'Mid-morning foot inspections.'),
('b2000001-0001-0001-0001-000000000035', 'Aarne Hiltunen', '+358501111035', 'aarne.hiltunen@email.fi', 'Välivainiontie 38, Oulu', 'Keskusta (City Center)', 'Home Health Aide', 'Blood pressure monitoring. Weekly visits.', '13:00', 'very_flexible', 'Afternoon visits preferred.'),

-- Low Priority Patients (15) - mostly very_flexible
('b2000001-0001-0001-0001-000000000036', 'Sylvi Lehtinen', '+358501111036', 'sylvi.lehtinen@email.fi', 'Keskustie 90, Oulu', 'Keskusta (City Center)', 'Home Visit - General Checkup', 'Monthly wellness check. Generally healthy.', '14:00', 'very_flexible', 'Afternoon preferred but very flexible.'),
('b2000001-0001-0001-0001-000000000037', 'Pentti Jokinen', '+358501111037', 'pentti.jokinen@email.fi', 'Raksilan puistotie 52, Oulu', 'Raksila', 'Chronic Disease Management', 'Stable diabetes follow-up. Good compliance.', '10:00', 'very_flexible', 'Any time works.'),
('b2000001-0001-0001-0001-000000000038', 'Mirja Ahola', '+358501111038', 'mirja.ahola@email.fi', 'Tuirantie 44, Oulu', 'Tuira', 'Home Visit - Medication Management', 'Medication review. Pill organizer check.', '11:00', 'very_flexible', 'Flexible scheduling.'),
('b2000001-0001-0001-0001-000000000039', 'Kalervo Niemelä', '+358501111039', 'kalervo.niemela@email.fi', 'Kastellintie 67, Oulu', 'Pohjois-Oulu', 'Home Visit - General Checkup', 'Preventive care visits. Annual assessment due.', '15:00', 'very_flexible', 'Afternoon works best.'),
('b2000001-0001-0001-0001-000000000040', 'Aili Partanen', '+358501111040', 'aili.partanen@email.fi', 'Höyhtyäntie 88, Oulu', 'Pohjois-Oulu', 'Nursing Care', 'Companion care. Social interaction visits.', '14:00', 'very_flexible', 'Afternoon social visits.'),
('b2000001-0001-0001-0001-000000000041', 'Mauno Karhu', '+358501111041', 'mauno.karhu@email.fi', 'Kaijonharjuntie 35, Oulu', 'Kontinkangas', 'Physical Therapy', 'Maintenance exercises. Keep mobile.', '10:00', 'very_flexible', 'Morning preferred but flexible.'),
('b2000001-0001-0001-0001-000000000042', 'Vieno Mäkelä', '+358501111042', 'vieno.makela@email.fi', 'Oulunsalontie 120, Oulu', 'Meri-Oulu', 'Home Visit - General Checkup', 'Routine health monitoring. Vital signs stable.', '13:00', 'very_flexible', 'Any time works well.'),
('b2000001-0001-0001-0001-000000000043', 'Einari Korhonen', '+358501111043', 'einari.korhonen@email.fi', 'Pyykösjärventie 78, Oulu', 'Pohjois-Oulu', 'Chronic Disease Management', 'Asthma management. Inhaler technique review.', '11:00', 'flexible', 'Late morning preferred.'),
('b2000001-0001-0001-0001-000000000044', 'Kerttu Leppänen', '+358501111044', 'kerttu.leppanen@email.fi', 'Maikkulantie 56, Oulu', 'Myllyoja', 'Home Visit - Medication Management', 'Blood thinner monitoring. INR checks.', '09:00', 'flexible', 'Morning INR checks.'),
('b2000001-0001-0001-0001-000000000045', 'Väinö Hyvärinen', '+358501111045', 'vaino.hyvarinen@email.fi', 'Korvensuorantie 99, Oulu', 'Pohjois-Oulu', 'Home Visit - General Checkup', 'General wellness visit. No acute issues.', '14:00', 'very_flexible', 'Very flexible with timing.'),
('b2000001-0001-0001-0001-000000000046', 'Sirkka Pulkkinen', '+358501111046', 'sirkka.pulkkinen@email.fi', 'Ritaharjuntie 44, Oulu', 'Pohjois-Oulu', 'Nursing Care', 'Health education. Diet and exercise counseling.', '15:00', 'very_flexible', 'Afternoon education sessions.'),
('b2000001-0001-0001-0001-000000000047', 'Taavi Kallio', '+358501111047', 'taavi.kallio@email.fi', 'Hiukkavaarantie 88, Oulu', 'Kaakkuri', 'Chronic Disease Management', 'Cholesterol monitoring. Statin therapy review.', '10:00', 'very_flexible', 'Any time works.'),
('b2000001-0001-0001-0001-000000000048', 'Hilma Seppänen', '+358501111048', 'hilma.seppanen@email.fi', 'Toppilansaarentie 31, Oulu', 'Meri-Oulu', 'Home Visit - General Checkup', 'Social wellness visits. Mental health check.', '14:00', 'very_flexible', 'Afternoon social visits preferred.'),
('b2000001-0001-0001-0001-000000000049', 'Armas Pitkänen', '+358501111049', 'armas.pitkanen@email.fi', 'Herukantie 67, Oulu', 'Kaakkuri', 'Physical Therapy', 'Gentle mobility exercises. Balance training.', '11:00', 'very_flexible', 'Late morning exercises.'),
('b2000001-0001-0001-0001-000000000050', 'Lyyli Eskola', '+358501111050', 'lyyli.eskola@email.fi', 'Talvikankantie 112, Oulu', 'Kaakkuri', 'Nursing Care', 'Preventive health care. Immunizations due.', '13:00', 'very_flexible', 'Afternoon appointments work well.');

-- =====================================================
-- PART 5: SET UP PROFESSIONAL SPECIALIZATIONS
-- =====================================================

-- Add specializations for all professionals
DO $$
DECLARE
    prof RECORD;
    spec_list TEXT[];
    spec TEXT;
BEGIN
    FOR prof IN 
        SELECT p.id, p.kind, p.specialty 
        FROM professionals p
    LOOP
        -- Base specializations based on kind
        IF prof.kind = 'nurse' THEN
            spec_list := ARRAY['Nursing Care', 'Medication Administration', 'Home Health Aide'];
        ELSE
            spec_list := ARRAY['Chronic Disease Management', 'Medication Administration'];
        END IF;
        
        -- Add variety based on ID
        IF prof.id % 5 = 0 THEN
            spec_list := array_append(spec_list, 'Wound Dressing');
            spec_list := array_append(spec_list, 'Post-operative Care');
        ELSIF prof.id % 5 = 1 THEN
            spec_list := array_append(spec_list, 'Physical Therapy');
            spec_list := array_append(spec_list, 'Respiratory Care');
        ELSIF prof.id % 5 = 2 THEN
            spec_list := array_append(spec_list, 'Palliative Care');
            spec_list := array_append(spec_list, 'Elderly Care');
        ELSIF prof.id % 5 = 3 THEN
            spec_list := array_append(spec_list, 'Diabetic Care');
            spec_list := array_append(spec_list, 'Cardiac Care');
        ELSE
            spec_list := array_append(spec_list, 'Home Visit - General Checkup');
            spec_list := array_append(spec_list, 'Home Visit - Wound Care');
        END IF;
        
        -- Insert specializations
        FOREACH spec IN ARRAY spec_list LOOP
            INSERT INTO professional_specializations (professional_id, specialization, certification_date)
            VALUES (prof.id, spec, NOW())
            ON CONFLICT (professional_id, specialization) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- PART 6: SET UP PROFESSIONAL SERVICE AREAS
-- =====================================================

DO $$
DECLARE
    prof RECORD;
    area_list TEXT[];
    area TEXT;
    all_areas TEXT[] := ARRAY[
        'Keskusta (City Center)', 'Raksila', 'Tuira', 'Meri-Oulu', 'Pateniemi',
        'Pohjois-Oulu', 'Kontinkangas', 'Kaakkuri', 'Myllyoja'
    ];
    start_idx INT;
    num_areas INT;
BEGIN
    FOR prof IN SELECT id FROM professionals LOOP
        -- Each professional covers 4-6 areas
        num_areas := 4 + (prof.id % 3);
        start_idx := (prof.id * 2) % 9;
        
        -- Always include central area
        area_list := ARRAY['Keskusta (City Center)'];
        
        -- Add more areas based on professional ID
        FOR i IN 1..num_areas LOOP
            area_list := array_append(area_list, all_areas[((start_idx + i) % 9) + 1]);
        END LOOP;
        
        -- Insert service areas
        FOREACH area IN ARRAY area_list LOOP
            INSERT INTO professional_service_areas (professional_id, service_area, is_primary)
            VALUES (prof.id, area, area = 'Keskusta (City Center)')
            ON CONFLICT (professional_id, service_area) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- PART 7: ADD is_active COLUMN AND UPDATE CAPACITY SETTINGS
-- =====================================================

-- Add is_active column if it doesn't exist
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update all professionals
UPDATE professionals 
SET 
    is_active = true,
    max_daily_hours = CASE 
        WHEN kind = 'doctor' THEN 6
        ELSE 8
    END,
    max_patients = CASE 
        WHEN kind = 'doctor' THEN 15
        ELSE 25
    END,
    current_patient_count = 0
WHERE id IN (SELECT id FROM professionals);

-- =====================================================
-- PART 8: ADD WORKING HOURS FOR PROFESSIONALS
-- =====================================================

DO $$
DECLARE
    prof RECORD;
    day_num INT;
    start_hour INT;
    end_hour INT;
BEGIN
    FOR prof IN SELECT id FROM professionals LOOP
        -- Determine shift based on ID
        IF prof.id % 3 = 0 THEN
            start_hour := 7;
            end_hour := 15;
        ELSIF prof.id % 3 = 1 THEN
            start_hour := 8;
            end_hour := 16;
        ELSE
            start_hour := 9;
            end_hour := 17;
        END IF;
        
        -- Add working hours for weekdays (1=Mon to 5=Fri)
        FOR day_num IN 1..5 LOOP
            -- Skip some days for variety
            IF NOT (prof.id % 4 = 0 AND day_num = 5) THEN
                INSERT INTO working_hours (professional_id, weekday, start_time, end_time)
                VALUES (
                    prof.id, 
                    day_num, 
                    (start_hour || ':00:00')::TIME, 
                    (end_hour || ':00:00')::TIME
                )
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

SELECT '=== MOCK DATA SUMMARY ===' as info;

SELECT 'Professionals by role:' as info;
SELECT kind, COUNT(*) as count FROM professionals GROUP BY kind;

SELECT 'Total patients:' as info;
SELECT COUNT(*) as patient_count FROM patients;

SELECT 'Patients by area:' as info;
SELECT area, COUNT(*) as count FROM patients GROUP BY area ORDER BY count DESC;

SELECT 'Patients by care type:' as info;
SELECT care_needed, COUNT(*) as count FROM patients GROUP BY care_needed ORDER BY count DESC;

SELECT 'Professional specializations:' as info;
SELECT specialization, COUNT(*) as professionals_count 
FROM professional_specializations 
GROUP BY specialization 
ORDER BY professionals_count DESC;

SELECT 'Service area coverage:' as info;
SELECT service_area, COUNT(*) as professionals_covering 
FROM professional_service_areas 
GROUP BY service_area 
ORDER BY professionals_covering DESC;

SELECT 'Working hours setup:' as info;
SELECT COUNT(DISTINCT professional_id) as professionals_with_hours FROM working_hours;

SELECT 'Patient visit time preferences:' as info;
SELECT visit_time_flexibility, COUNT(*) as patient_count 
FROM patients 
GROUP BY visit_time_flexibility 
ORDER BY patient_count DESC;

SELECT 'Patient preferred visit times distribution:' as info;
SELECT 
    CASE 
        WHEN preferred_visit_time < '10:00' THEN 'Early Morning (before 10:00)'
        WHEN preferred_visit_time < '12:00' THEN 'Late Morning (10:00-12:00)'
        WHEN preferred_visit_time < '15:00' THEN 'Early Afternoon (12:00-15:00)'
        ELSE 'Late Afternoon (15:00+)'
    END as time_slot,
    COUNT(*) as patient_count
FROM patients 
WHERE preferred_visit_time IS NOT NULL
GROUP BY 
    CASE 
        WHEN preferred_visit_time < '10:00' THEN 'Early Morning (before 10:00)'
        WHEN preferred_visit_time < '12:00' THEN 'Late Morning (10:00-12:00)'
        WHEN preferred_visit_time < '15:00' THEN 'Early Afternoon (12:00-15:00)'
        ELSE 'Late Afternoon (15:00+)'
    END
ORDER BY time_slot;

SELECT '=== DATA LOADED SUCCESSFULLY ===' as info;
