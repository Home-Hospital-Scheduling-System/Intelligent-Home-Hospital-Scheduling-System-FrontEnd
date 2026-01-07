# Patient Dashboard - Complete Guide

## Overview
The patient dashboard provides a comprehensive view of a patient's healthcare journey, including upcoming visits, assigned professionals, and personal healthcare preferences.

## Features

### 1. **Header Section**
- Personalized greeting with patient's first name
- Profile icon button to view quick profile summary
- Clean navigation

### 2. **Upcoming Visits Section** 📅
The main feature showing all scheduled appointments in the future.

#### Visit Card Details:
Each visit displays:
- **Visit Status Badge**: Shows current status (Scheduled, Completed, etc.)
- **Date**: Full formatted date with day of week
- **Time**: Start and end times
- **Care Type**: The type of treatment/care (e.g., "Wound Dressing", "Physical Therapy")

#### Expandable Visit Details (Click to expand):
When clicking on a visit card, patients see:

##### **Healthcare Professional Information**
- **Name**: Full name of the professional visiting
- **Type**: Professional type (Doctor, Nurse, Therapist, etc.)
- **Specialty**: Specific expertise (e.g., "Wound Care Specialist")
- **Email**: Contact email for direct communication
- **Phone**: Phone number to reschedule or ask questions

##### **Visit Notes**
- Any special instructions from the coordinator or professional

##### **Scheduling Details**
- **Time Flexibility**: How flexible the scheduling is (fixed, flexible ±2 hours, flexible ±4 hours, flexible all day)
- **Special Notes**: Any patient-specific scheduling notes (e.g., "Patient sleeps until 10 AM")

##### **Reminder**
- Helpful tip to contact professional if rescheduling needed

### 3. **Assigned Healthcare Professionals Section** 👥
Shows all active professionals assigned to manage the patient's care.

#### Professional Cards Display:
- **Professional Name** with icon
- **Type**: Role/profession (Doctor, Nurse, etc.)
- **Specialty**: Area of expertise
- **Email**: Contact information
- **Phone**: Direct phone number
- **Status**: Assignment status (active, completed, etc.)

### 4. **Personal Profile Section** ℹ️
Displays all patient information in organized cards:

#### Quick Info Cards:
- **Full Name** (👤)
- **Email** (📧)
- **Phone** (📱)
- **Address** (📍)

#### Visit Scheduling Preferences
A dedicated section showing:
- **Preferred Visit Time** (🕐): The time patient prefers care visits
- **Time Flexibility** (🎯): How flexible the schedule is
- **Special Notes** (📝): Any scheduling considerations

**Edit Button**: Opens preference editor to update scheduling settings

#### Medical Notes
If applicable, displays important medical information stored in the system.

## Data Flow

### Loading Patient Data
1. Component loads and identifies patient by `profile_id`
2. Fetches patient profile from `patients` table
3. Queries `patient_assignments` for assigned professionals
4. Fetches upcoming `schedules` with related professional and patient details
5. Loads profile information for each assigned professional

### Data Sources

| Data | Source | Purpose |
|------|--------|---------|
| Patient Info | `patients` table | Address, medical notes, visit preferences |
| Upcoming Visits | `schedules` table | Visit details, timing, professional info |
| Professionals | `professionals` + `profiles` tables | Care provider information |
| Assignments | `patient_assignments` table | Active professional relationships |

## Key Database Queries

### Fetch Patient Profile
```javascript
await supabase
  .from('patients')
  .select('*')
  .eq('profile_id', profile.id)
  .single()
```

### Fetch Upcoming Visits
```javascript
await supabase
  .from('schedules')
  .select('*, professionals(id, kind, specialty, profile_id), patients(area, care_needed, visit_time_flexibility, visit_notes)')
  .eq('patient_id', patient.id)
  .gte('start_time', now)
  .order('start_time', { ascending: true })
```

### Fetch Assigned Professionals
```javascript
await supabase
  .from('patient_assignments')
  .select('*, professionals(id, kind, specialty, profile_id)')
  .eq('patient_id', patient.id)
  .eq('status', 'active')
```

## Modals

### Profile Modal
Quick view of essential patient information:
- Name
- Email
- Phone
- Address
- Care Needs

### Preferences Modal
Edit patient visit scheduling preferences:
- Preferred visit time
- Time flexibility level
- Special scheduling notes

Uses `EditPatientPreferences` component for full editing interface.

## User Interactions

### Expand/Collapse Visits
- Click on visit card to expand and see professional details
- Click again to collapse
- Visual indicator (▶/▼) shows expand state

### Edit Preferences
- Click "Edit Preferences" button in scheduling section
- Opens modal with full preference editor
- Changes saved immediately to database
- Dashboard refreshes to show updates

### View Profile
- Click profile icon (👤) in header
- Quick modal shows essential profile info
- Click "Close" to dismiss

## Styling & UX Features

### Color Scheme
- **Primary Blue**: Upcoming visits, main information
- **Green**: Assigned professionals, preferences
- **Yellow**: Visit notes, scheduling details
- **Red**: Medical notes, important alerts

### Responsive Design
- Grid layouts adjust from mobile to desktop
- Cards stack on small screens
- Touch-friendly buttons and interactive elements

### Visual Feedback
- Hover effects on buttons and cards
- Status badges with color coding
- Icons for quick recognition
- Smooth transitions and animations

## Future Enhancements

1. **Past Visits History**: Section to view completed visits
2. **Visit Feedback**: Allow patients to rate/review professional visits
3. **Communication Hub**: Direct messaging with professionals
4. **Appointment Requests**: Patient can request specific times
5. **Health Records**: Access to detailed medical history and documents
6. **Prescription Info**: View current medications and prescriptions
7. **Mobile App**: Native mobile version for appointments on the go

## Integration Notes

### With ProfessionalView
- Both dashboards show similar information from different perspectives
- Professionals see all their assigned patients
- Patients see the professionals assigned to them
- Data consistency via shared database tables

### With Scheduling System
- Visit times respect patient time preferences
- Time slot optimizer considers patient flexibility
- Coordinators can view preferences when scheduling

### With EditPatientPreferences
- Reuses existing component for consistency
- Follows same data update pattern
- Real-time database synchronization
