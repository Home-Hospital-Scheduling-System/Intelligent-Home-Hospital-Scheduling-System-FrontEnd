# Schema Refactor Implementation Checklist

## Pre-Implementation ✅
- [x] Identified redundancy in old schema
- [x] Designed improved schema without redundancy
- [x] Created migration SQL script
- [x] Created demo data matching new schema
- [x] Updated Auth component with role-specific fields
- [x] Updated App.jsx for new data structure
- [x] Created documentation and guides

## Now: Your Turn 🎯

### Step 1: Run Migration SQL
- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Create a new query
- [ ] Copy entire content from: `supabase/migration_v2_improved_schema.sql`
- [ ] Click "Run" button
- [ ] Verify tables created (should see 6 tables: profiles, patients, professionals, locations, working_hours, schedules)
- [ ] No errors?

### Step 2: Load Demo Data
- [ ] Create new SQL query
- [ ] Copy entire content from: `supabase/demo_data_v2.sql`
- [ ] Click "Run" button
- [ ] Verify data loaded by running: `SELECT COUNT(*) FROM profiles;`
- [ ] Should show: 8 profiles

### Step 3: Test in App
- [ ] Stop dev server: `Ctrl+C`
- [ ] Start dev server: `npm run dev`
- [ ] Open browser: `http://localhost:5174`
- [ ] Sign up as **Patient**:
  - [ ] Use test email: `test.patient@example.com`
  - [ ] Full name: `Test Patient`
  - [ ] Phone: `+1234567890`
  - [ ] Role: Select "Patient"
  - [ ] Check: Address field appears ✓
  - [ ] Enter address: `123 Main St, Test City`
  - [ ] Click "Create account"
  - [ ] Sign out after successful signup

- [ ] Sign up as **Professional**:
  - [ ] Use test email: `test.prof@example.com`
  - [ ] Full name: `Test Doctor`
  - [ ] Phone: `+0987654321`
  - [ ] Role: Select "Professional (Doctor/Nurse)"
  - [ ] Check: Professional Type dropdown appears ✓
  - [ ] Check: Specialty dropdown appears ✓
  - [ ] Select type: "Doctor"
  - [ ] Select specialty: "Cardiology"
  - [ ] License: `TEST-LIC-001`
  - [ ] Click "Create account"
  - [ ] Sign out after successful signup

### Step 4: Verify Database Updates
- [ ] Go to Supabase Dashboard → Table Editor
- [ ] Check **profiles** table:
  - [ ] Should have 2 new rows (test patient + test prof)
  - [ ] Verify columns: id, full_name, email, phone, role
  - [ ] Patient and professional both have email ✓

- [ ] Check **patients** table:
  - [ ] Should have 1 new row (test patient)
  - [ ] Verify columns: id, profile_id, address, medical_notes
  - [ ] Address saved: "123 Main St, Test City" ✓

- [ ] Check **professionals** table:
  - [ ] Should have 1 new row (test doctor)
  - [ ] Verify columns: id, profile_id, kind, specialty, license_number
  - [ ] Kind: "doctor" ✓
  - [ ] Specialty: "Cardiology" ✓
  - [ ] License: "TEST-LIC-001" ✓

### Step 5: Test Sign In
- [ ] Sign in with test patient account
  - [ ] Email: `test.patient@example.com`
  - [ ] Should see patient dashboard
  - [ ] Sign out ✓

- [ ] Sign in with test professional account
  - [ ] Email: `test.prof@example.com`
  - [ ] Should see professional view
  - [ ] Sign out ✓

### Step 6: Check Console (F12)
- [ ] Open browser console
- [ ] Sign up as professional
- [ ] Check logs:
  - [ ] Should see: `Inserting professional: {profile_id, kind, specialty, ...}`
  - [ ] Should see: `Professional inserted successfully: [...]`

## After Implementation 🎉

### Cleanup
- [ ] Delete test accounts if not needed
- [ ] Remove old demo data from old schema (already dropped in migration)

### Documentation
- [ ] Read through: `SCHEMA_MIGRATION_GUIDE.md`
- [ ] Read through: `SCHEMA_REFACTOR_SUMMARY.md`
- [ ] Share with team if applicable

### Next Steps
- [ ] Move to "Scheduling Features" backlog item
- [ ] Consider RLS (Row Level Security) policies for production
- [ ] Add more test cases for edge cases

## Troubleshooting 🆘

### Migration fails with "table already exists"
- **Solution**: Check old migration first - tables should auto-drop
- Run: `DROP TABLE IF EXISTS schedules CASCADE;` etc. manually first

### Demo data fails to load
- **Solution**: Check if migration ran successfully first
- Verify profile IDs in demo_data_v2.sql match migration expectations

### Auth signup not creating professional row
- **Solution**: 
  - Check browser console (F12) for error messages
  - Verify `professionals` table structure has all columns
  - Check `specialty` field is not empty when inserting

### Address not showing in signup form
- **Solution**: Make sure you selected "Patient" role in signup form
- Form only shows role-specific fields when role is selected

### Sign in fails after signup
- **Solution**: 
  - If email confirmation is enabled: check email for confirmation link
  - Run `node scripts/test_auth.js` to check Supabase settings
  - Try disabling "Confirm email" in Supabase → Authentication → Providers

## Success Criteria ✅

All items complete when:
1. ✅ Migration SQL ran without errors
2. ✅ Demo data loaded (8 profiles visible)
3. ✅ App starts and loads without errors
4. ✅ Can sign up as Patient (address field visible)
5. ✅ Can sign up as Professional (specialty dropdown visible)
6. ✅ Patient data in `patients` table with address
7. ✅ Professional data in `professionals` table with kind & specialty
8. ✅ Can sign in and see appropriate dashboard
9. ✅ Sign out works correctly

## Questions? 💭

Refer to:
- `SCHEMA_MIGRATION_GUIDE.md` - Detailed implementation guide
- `SCHEMA_REFACTOR_SUMMARY.md` - Overview of changes
- `supabase/migration_v2_improved_schema.sql` - Schema definition
- `supabase/demo_data_v2.sql` - Sample data
- Browser console (F12) - Error messages during signup
