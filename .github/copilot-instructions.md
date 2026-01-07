# AI-Powered Home Hospital Scheduling System - Copilot Instructions

## System Overview

This is a React + Vite + Supabase frontend for a home hospital care coordination platform. The system intelligently matches patients to healthcare professionals based on expertise, geography, availability, and workload.

**Core users**: Coordinators (assign patients), Professionals (manage assigned patients), Supervisors (oversee operations), Patients (receive care).

## Architecture & Data Flow

### Authentication & Role-Based Access
- Supabase Auth (`src/lib/supabaseClient.js`) manages sessions
- `App.jsx` loads user profile and routes to appropriate dashboard
- Three roles: `coordinator`, `professional`, `patient`, `supervisor`
- Profiles store: id, full_name, email, phone, role

### Key Tables (Supabase)
- **profiles**: User accounts (email, role, name, phone)
- **patients**: Care recipients (profile_id, address, area, care_needed, medical_notes)
- **professionals**: Care providers (profile_id, kind, specialty, license_number)
- **patient_assignments**: Match records (patient_id, professional_id, status, match_score)
- **working_hours**: Professional availability (professional_id, weekday, start_time, end_time)
- **schedules**: Visits (patient_id, professional_id, start_time, end_time, status)

### Patient Visit Preferences (NEW)
Patients now have scheduling preferences stored in the `patients` table:
- `preferred_visit_time` (TIME): When patient prefers care
- `visit_time_flexibility` (STRING): "fixed" | "flexible_2hours" | "flexible_4hours" | "flexible_all_day"
- `visit_notes` (TEXT): Special scheduling notes
- `next_appointment_date` (DATE) / `next_appointment_time` (TIME): Coordinator-scheduled visits

## Component Hierarchy & Responsibilities

### Coordinator Views
- **PatientAssignmentManager.jsx**: Dashboard to assign unassigned patients to professionals; filters by area/skill
- **AssignPatient.jsx**: Modal form for assigning one patient; calls AI engine for suggestions

### Professional Views
- **ProfessionalView.jsx**: Shows assigned patients, working hours, patient details; can add/update patient records
- **ProfessionalSetup.jsx**: Configure specializations and service areas

### Supervisor/Admin Views
- **SupervisorDashboard.jsx**: System overview (patient/professional counts by area/specialty); manage professional working hours
- **CoordinatorSchedules.jsx**: Upcoming visits schedule

### Patient Views
- **PatientView.jsx**: Full patient dashboard showing upcoming visits, assigned professionals, and personal profile with visit preferences

### Shared Components
- **Auth.jsx**: Role-specific signup (patients enter address, professionals choose specialty)
- **AddPatient.jsx**: Professionals add new patients (now includes visit preferences)
- **UpdatePatient.jsx**: Update patient status, next appointment, treatment notes
- **EditPatientPreferences.jsx**: Edit patient visit time preferences

## Critical Algorithms

### AI Assignment Engine (`src/lib/aiAssignmentEngine.js`)
Matches patients to professionals using multi-factor scoring:

1. **Skill Match** (0-100): Direct specialty match = 100; keyword overlap = 75; no match = 0
2. **Availability Score** (0-100): Based on (workload capacity, shift frequency)
3. **Service Area Match** (0-100): Exact area match = 100; partial = 60; none = 0
4. **Geographic Clustering Bonus** (+0-20): Bonus if professional already has patients in patient's area

**Final Score** = (Skill × weight) + (Availability × weight) + (Area × weight) + Clustering Bonus

Returns top matches with scores; used by `PatientAssignmentManager` to suggest professionals.

### Time Slot Optimizer (`src/lib/timeSlotOptimizer.js`)
Optimizes visit schedules considering:
- **Care duration**: Different care types take different time (45-60 min typical)
- **Travel time matrix**: Pre-calculated minutes between Oulu districts
- **Patient preferences**: Respects preferred_visit_time and flexibility
- **Professional working hours**: Schedules only during available shifts

## Developer Workflows

### Setting Up Local Dev
```bash
npm install
cp .env.example .env.local
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev  # Starts at http://localhost:5173
```

### Database Setup
Migrations in `supabase/migration_*.sql` are idempotent. Key ones:
- `migration_v2_improved_schema.sql`: Core tables
- `migration_add_patient_visit_preferences.sql`: Visit timing fields
- `migration_add_next_appointment.sql`: Next appointment scheduling

Load demo data: `supabase/demo_data_v2.sql`

### Testing Role-Based Access
Use test accounts from `supabase/demo_data_v2.sql`, or:
1. Run Auth.jsx signup flow
2. Profile auto-creates in pending state (localStorage cache)
3. Confirm email in Supabase Auth tab → profile finalizes

## Project-Specific Patterns

### Supabase Queries
- Always `.select()` relations with dot notation: `.select('*, professionals(kind, specialty)')`
- Use `.eq('status', 'active')` for filtering active assignments
- Order by `created_at` descending for recent-first UI

### Visit Preferences Integration
- **Registration**: `AddPatient.jsx` captures preferred_visit_time, visit_time_flexibility
- **Update**: `EditPatientPreferences.jsx` modifies existing preferences; called from patient detail views
- **Scheduling**: `timeSlotOptimizer.js` respects flexibility windows when finding slots

### State Management
- Use local state (`useState`) in components
- Store assignment suggestions in state during modal open
- Refetch patients list after assignment/removal (call `fetchPatients()`)

### Error Handling
- Try-catch all Supabase calls; set state error messages
- Display errors to user via conditional rendering
- Log to console for debugging: `console.error('context', error)`

## Patient Dashboard Implementation ✅

The patient dashboard (`PatientView.jsx`) is now fully implemented with the following features:

### Core Features
1. **Profile Management**: View personal info (name, email, phone, address) with expandable profile modal
2. **Upcoming Visits**: Expandable visit cards showing:
   - Date, time, and care type
   - Assigned healthcare professional details (name, specialty, contact info)
   - Visit notes and scheduling preferences
   - Status badge

3. **Assigned Professionals**: Grid view of all active care providers with:
   - Professional type and specialty
   - Contact information
   - Assignment status

4. **Visit Preferences**: Display and edit scheduling preferences:
   - Preferred visit time
   - Time flexibility level
   - Special scheduling notes

5. **Medical Information**: View stored medical notes related to care

### Data Query Patterns
- **Upcoming visits**: `schedules` with professional + patient relations, filtered by future dates
- **Professional details**: Fetch from `professionals` + `profiles` via assignments
- **Patient preferences**: Stored in `patients` table columns

### Key Implementation Details
- Expandable visit cards for detailed professional information
- Color-coded sections for quick visual scanning
- Responsive grid layout for professional cards
- Modal dialogs for profile and preferences
- Real-time preference updates with `EditPatientPreferences` component
- Separate upcoming vs past visit handling

## Future Enhancements

When expanding patient features, consider:
1. **Past Visits History**: Show completed appointments
2. **Visit Feedback**: Rating/review system for professionals
3. **Communication Hub**: Direct messaging with care team
4. **Health Records**: Access to medical documents
5. **Prescription Management**: View current medications
6. **Mobile Notifications**: Appointment reminders
