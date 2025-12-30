# Visit Time Preferences & Next Appointment Scheduling Integration

## Overview
This document describes the implementation of visit time preferences during patient registration and next appointment scheduling during patient updates.

## Changes Summary

### 1. Database Migration
**File**: `supabase/migration_add_next_appointment.sql`

Added two new columns to the `patients` table:
- `next_appointment_date` (DATE) - The date of the patient's next scheduled appointment
- `next_appointment_time` (TIME) - The time in HH:MM format of the next appointment

**Execution**:
```sql
ALTER TABLE patients ADD COLUMN IF NOT EXISTS next_appointment_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS next_appointment_time TIME;
CREATE INDEX IF NOT EXISTS idx_patients_next_appointment_date ON patients(next_appointment_date);
```

### 2. Patient Registration Form (AddPatient.jsx)

#### New Fields Added:
1. **Preferred Visit Time** (⏰)
   - Input type: `time` 
   - Field name: `preferred_visit_time`
   - Purpose: Allows professionals to set the patient's preferred time for home visits
   - Default: Empty (optional)

2. **Visit Time Flexibility** (🎯)
   - Input type: `select`
   - Field name: `visit_time_flexibility`
   - Options:
     - `strict` - Must be exact time
     - `flexible` - ±1 hour window acceptable (default)
     - `very_flexible` - ±2+ hours acceptable
   - Purpose: Defines how much flexibility the patient has with appointment timing

3. **Visit Notes** (📋)
   - Input type: `textarea`
   - Field name: `visit_notes`
   - Purpose: Any special notes about visit timing or scheduling preferences
   - Example: "busy on weekends, prefers mornings, only available 2-4pm"

#### Data Saved to Database:
```javascript
{
  name: formData.name,
  phone: formData.phone,
  email: formData.email,
  address: formData.address,
  area: formData.area,
  care_needed: formData.care_needed,
  preferred_visit_time: formData.preferred_visit_time || null,
  visit_time_flexibility: formData.visit_time_flexibility,  // default: 'flexible'
  visit_notes: formData.visit_notes || null,
  medical_notes: formData.medical_notes,
  profile_id: profileId
}
```

### 3. Patient Update Form (UpdatePatient.jsx)

#### New Field Added:
**Next Appointment Time** (🕐)
- Input type: `time`
- Field name: `next_appointment_time`
- Purpose: Set the time for the patient's next scheduled appointment
- Works with existing `next_appointment_date` field

#### Form State:
```javascript
const [formData, setFormData] = useState({
  status: 'active',
  sessions_completed: 0,
  next_appointment_date: '',
  next_appointment_time: '',  // NEW
  treatment_notes: ''
})
```

#### Data Saved to Database:
```javascript
{
  status: formData.status,
  sessions_completed: formData.sessions_completed,
  next_appointment_date: formData.next_appointment_date || null,
  next_appointment_time: formData.next_appointment_time || null,  // NEW
  treatment_notes: formData.treatment_notes,
  updated_at: new Date().toISOString()
}
```

## Workflow Integration

### 1. Patient Registration Workflow
```
Professional creates new patient
  ↓
Fill basic info (name, phone, address)
  ↓
Set care type needed
  ↓
Set preferred visit time (e.g., 09:00)
  ↓
Set visit flexibility (strict/flexible/very_flexible)
  ↓
Add visit notes (optional)
  ↓
Patient record saved with preferences
  ↓
System uses preferences when scheduling visits
```

### 2. Post-Visit Appointment Scheduling
```
Professional completes patient visit
  ↓
Open "Update Patient" form
  ↓
Increment sessions completed
  ↓
Update patient status (active/completed/paused)
  ↓
Set next appointment date (date picker)
  ↓
Set next appointment time (time picker)
  ↓
Add treatment notes
  ↓
Save - next appointment saved to database
```

## AI Scheduling Integration

The existing `timeSlotOptimizer.js` already includes:
- **matchesPatientTimePreference()** - Validates if a proposed time matches patient's preferred window
- **smartAssignPatient()** - Schedules patients respecting their time preferences

### How Preferences Are Used:
1. First pass: Try to schedule at preferred_visit_time
2. If not available: Apply flexibility window (±1 or ±2 hours)
3. If still not available: Expand search but note the compromise
4. All scheduling respects care_duration + travel_time constraints

## Database Fields Reference

### On `patients` Table:
| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `preferred_visit_time` | TIME | Preferred time for visits | "09:00" |
| `visit_time_flexibility` | VARCHAR | How flexible timing is | "flexible" |
| `visit_notes` | TEXT | Special scheduling notes | "busy weekends" |
| `next_appointment_date` | DATE | Date of next visit | "2024-12-20" |
| `next_appointment_time` | TIME | Time of next visit | "10:30" |

## Benefits

1. **Patient Preference Respect**: Patients aren't scheduled at inconvenient times
2. **Scheduling Efficiency**: Professionals know upfront when patients prefer visits
3. **Workflow Integration**: Next appointment set during post-visit documentation
4. **Flexibility**: System can work with strict schedules or very flexible patients
5. **Historical Tracking**: Next appointment data can be used for follow-up analytics

## Notes

- All time-related fields are optional (nullable)
- Default visit_time_flexibility is "flexible" for new patients
- Time picker uses 24-hour format (HH:MM)
- Visit preferences are loaded when scheduling new visits via the AI system
- Next appointment times become part of the patient's assignment records

## Testing Checklist

- [ ] Create patient with visit time preferences
- [ ] Verify preferences saved in database
- [ ] Update patient with next appointment date and time
- [ ] Verify both fields saved in database
- [ ] Confirm AI scheduler respects preferences when assigning
- [ ] Check ProfessionalView displays next appointment info
- [ ] Test all flexibility levels (strict/flexible/very_flexible)
- [ ] Verify optional fields don't cause errors if empty

