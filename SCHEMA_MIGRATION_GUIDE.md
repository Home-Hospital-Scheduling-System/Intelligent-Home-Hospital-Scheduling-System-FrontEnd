# Database Schema Refactor - Implementation Guide

## Overview
This document outlines the improved database schema that eliminates redundancy and improves data organization.

## 📋 What Changed

### Old Schema Issues
- ❌ Phone number duplicated in both `profiles` and `patients` tables
- ❌ Email duplicated (should only be in profiles)
- ❌ Address in `patients` but also a separate `locations` table (confusing)
- ❌ Patients table had `name`, `phone`, `email` - all should come from profiles

### New Schema Design
- ✅ **profiles** - Contains: `id`, `full_name`, `email`, `phone`, `role`
- ✅ **patients** - Contains: `id`, `profile_id`, `address`, `medical_notes`
- ✅ **professionals** - Contains: `id`, `profile_id`, `kind`, `specialty`, `license_number`
- ✅ **locations** - For clinics/facilities only (NOT home addresses)

## 🔧 Implementation Steps

### Step 1: Run Migration SQL
1. Go to your Supabase Dashboard
2. Click **SQL Editor** 
3. Create new query
4. Copy the entire content from `supabase/migration_v2_improved_schema.sql`
5. Run the query (⚡ button)
6. Verify: Tables should be empty and ready for data

### Step 2: Load Demo Data
1. In SQL Editor, create new query
2. Copy the entire content from `supabase/demo_data_v2.sql`
3. Run the query
4. Verify: Should see demo profiles, patients, professionals, locations, working_hours, schedules

### Step 3: Test the App
1. Stop dev server (if running): `Ctrl+C`
2. Start dev server: `npm run dev`
3. Open browser: `http://localhost:5174`
4. Try signing up as:
   - **Patient**: Should see "Address" field
   - **Professional**: Should see "Professional Type" and "Specialty" dropdowns

## 📊 New Database Schema Details

### profiles table
```
id (UUID) - matches Supabase auth user id
full_name (TEXT) - user's full name
email (TEXT) - unique, user's email
phone (TEXT) - optional phone number
role (TEXT) - 'patient', 'professional', 'coordinator', 'supervisor'
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### patients table
```
id (SERIAL) - primary key
profile_id (UUID) - foreign key to profiles
address (TEXT) - home address
medical_notes (TEXT) - allergies, conditions, etc.
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### professionals table
```
id (SERIAL) - primary key
profile_id (UUID) - foreign key to profiles
kind (TEXT) - 'doctor', 'nurse', 'therapist', 'counselor'
specialty (TEXT) - 'Wound Care', 'Cardiology', etc.
license_number (TEXT) - optional
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### locations table
```
id (SERIAL) - primary key
name (TEXT) - 'Central Clinic', 'Hospital A'
address (TEXT) - facility address
type (TEXT) - 'clinic', 'hospital', 'nursing_home', 'office'
phone (TEXT) - facility phone
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

## 🎯 Signup Flow

### Patient Signup
```
Email & Password (required) → Full Name → Phone (optional)
→ Role: "Patient" selected
→ Address field appears
→ Creates: profiles + patients rows
```

### Professional Signup
```
Email & Password (required) → Full Name → Phone (optional)
→ Role: "Professional" selected
→ Professional Type: doctor/nurse/therapist/counselor/other
→ Specialty: dropdown list + custom "Other" option
→ License Number (optional)
→ Creates: profiles + professionals rows
```

### Coordinator/Supervisor Signup
```
Email & Password (required) → Full Name → Phone (optional)
→ Role: "Coordinator" or "Supervisor"
→ Creates: profiles row only
```

## 🔍 Key Features

### Smart Specialty Dropdown
- Pre-populated with common specialties:
  - Wound Care Specialist
  - Community Nursing
  - Cardiology
  - General Practice
  - Physiotherapy
  - Counseling
  - Occupational Therapy
  - Other (please specify)

- If user selects "Other", shows text input for custom specialty

### Email Confirmation Handling
- If email confirmation is enabled on Supabase:
  - Signup stores data in localStorage
  - After email confirmation & sign in, profile/professional rows are auto-created
  - No data loss

### Data Integrity
- Cascade delete: Deleting a profile also deletes related patient/professional rows
- Unique constraints: One profile = one patient OR one professional
- Check constraints: Role must be valid, weekday 1-7, status in allowed values

## 📝 Common Queries

### Get patient with all details
```sql
SELECT p.*, pa.address, pa.medical_notes
FROM profiles p
LEFT JOIN patients pa ON pa.profile_id = p.id
WHERE p.role = 'patient'
```

### Get professional with schedule
```sql
SELECT p.*, pr.kind, pr.specialty, pr.license_number
FROM profiles p
LEFT JOIN professionals pr ON pr.profile_id = p.id
WHERE p.role = 'professional'
```

### Get upcoming visits
```sql
SELECT s.*, p.full_name as patient_name, prof.full_name as professional_name, loc.name as location_name
FROM schedules s
JOIN patients pa ON pa.id = s.patient_id
JOIN profiles p ON p.id = pa.profile_id
JOIN professionals pr ON pr.id = s.professional_id
JOIN profiles prof ON prof.id = pr.profile_id
LEFT JOIN locations loc ON loc.id = s.location_id
WHERE s.start_time > NOW()
ORDER BY s.start_time ASC
```

## ✅ Verification Checklist

- [ ] Migration SQL ran successfully (no errors)
- [ ] Demo data loaded (check in Supabase SQL: `SELECT COUNT(*) FROM profiles`)
- [ ] App starts without errors: `npm run dev`
- [ ] Can sign up as Patient (shows address field)
- [ ] Can sign up as Professional (shows specialty dropdown)
- [ ] Patient data appears in `patients` table after signup
- [ ] Professional data appears in `professionals` table after signup
- [ ] Email confirmation flow works (if enabled): data persists after confirmation

## 🆘 Troubleshooting

### "Invalid input syntax for UUID"
- The `auth_id` field was in the old schema but removed
- Use `id UUID PRIMARY KEY` directly (matches auth.users.id)

### "profiles table already exists"
- Run the migration script - it drops old tables first

### Email not saving
- Check that email is in the form and not empty
- Verify `profiles` table has email column

### Professional specialty not saving
- Ensure specialty dropdown value is selected before signup
- If "Other" is selected, make sure custom text is entered

## 📚 Next Steps

1. **RLS Policies**: Enable Row Level Security for production
2. **Indexes**: Already created for performance
3. **Tests**: Add integration tests for signup flow
4. **Documentation**: Update team with new schema
