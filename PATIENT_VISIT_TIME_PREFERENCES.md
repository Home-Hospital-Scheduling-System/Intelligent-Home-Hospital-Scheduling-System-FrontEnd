# Patient Visit Time Preferences Feature

## Overview
This feature allows coordinators to specify **preferred visiting times** for each patient, and the AI scheduling system will respect these preferences when assigning visits.

## Why This Matters
- **Patient Preferences**: Some patients prefer morning visits (8-10 AM), others prefer afternoons (2-4 PM)
- **Medication Schedules**: Strict medication times (e.g., "must take at 2 PM") require fixed visit times
- **Work/Activity Conflicts**: Patient might have physio at 11 AM or meditation at 3 PM daily
- **Improved Scheduling**: Respects patient routines and medical requirements

## Database Schema

### New Columns Added to `patients` Table:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `preferred_visit_time` | TIME | '09:00' | Patient's preferred visit time (e.g., '14:00' for 2 PM) |
| `visit_time_flexibility` | VARCHAR(50) | 'flexible_4hours' | How flexible the patient is with timing |
| `visit_notes` | TEXT | NULL | Special notes (e.g., "Sleeps until 10 AM", "Has therapy at 3 PM") |

### Flexibility Options:

1. **'fixed'** - STRICT
   - Must visit within 30 minutes of preferred time
   - Use for: Medication administration, critical care schedules
   - Example: "Patient takes blood pressure medication at 2 PM sharp"

2. **'flexible_2hours'** - MODERATE
   - Visit can be within 2 hours of preferred time
   - Use for: Most daily care, general checkups
   - Example: "Prefers morning (9 AM) but can do 7 AM - 11 AM"

3. **'flexible_4hours'** - FLEXIBLE (DEFAULT)
   - Visit can be within 4 hours of preferred time
   - Use for: Most patients without strict requirements
   - Example: "Prefers afternoon but available 12 PM - 6 PM"

4. **'flexible_all_day'** - VERY FLEXIBLE
   - Any time during professional's working hours
   - Use for: Independent patients with no constraints
   - Example: "Available whenever convenient"

## How the AI Assignment Uses It

### Assignment Flow:
1. Coordinator sets patient's preferred time (9 AM, 2 PM, etc.) and flexibility
2. User clicks "Auto Assign" in PatientAssignmentManager
3. System searches for professionals:
   - **First pass**: Looks for time slots matching patient preference
   - **Second pass** (if no preferred found): Uses flexibility setting to expand search window
   - **Final**: Assigns to first available slot within constraints

### Example Scenario:

**Patient: John (prefers 2 PM, fixed)**
- Preferred time: `14:00` (2 PM)
- Flexibility: `fixed` (±30 minutes)
- Acceptable times: **1:30 PM - 2:30 PM only**

Professional's available slots on Day 1:
- 9:00 AM - ❌ Outside window
- 11:30 AM - ❌ Outside window  
- 2:10 PM - ✅ MATCH! (within ±30 min of 2 PM)
- 4:00 PM - ❌ Outside window

→ **Assigned to 2:10 PM** ✓

**Patient: Sarah (prefers 9 AM, flexible_4hours)**
- Preferred time: `09:00` (9 AM)
- Flexibility: `flexible_4hours` (±4 hours)
- Acceptable times: **5:00 AM - 1:00 PM** (within 4 hours)

Professional's available slots on Day 1:
- 7:30 AM - ✓ Matches preference (within 4 hours, closer to 9 AM)
- 2:00 PM - ✓ Available but less preferred (outside 4-hour window)

→ **Assigned to 7:30 AM** ✓ (preferred slot chosen)

## UI Components

### EditPatientPreferences Component
Location: `src/components/EditPatientPreferences.jsx`

Features:
- Time picker for preferred visit time
- Dropdown for flexibility level with descriptions
- Notes field for special instructions
- Save/Cancel buttons
- Helpful tooltip explaining the system

Usage:
```jsx
import EditPatientPreferences from '../components/EditPatientPreferences'

// In parent component:
<EditPatientPreferences 
  patient={selectedPatient}
  onClose={() => setShowPrefs(false)}
  onUpdated={() => loadPatients()}
/>
```

## Implementation Details

### Time Matching Function
`matchesPatientTimePreference(proposedTime, patientPreferences)`

- Converts times to minutes from midnight
- Calculates absolute difference
- Checks against flexibility window
- Returns true/false for slot match

### Algorithm Integration
In `smartAssignPatient()`:
1. First loop: Try to find slots matching patient preference
2. If no match and flexibility allows: Expand search
3. Log preference match status in console
4. Store `matchesPreference` boolean in assignment

### Database Migration
File: `migration_add_patient_visit_preferences.sql`

Adds columns with:
- Default values for existing patients
- Indexes for faster queries
- Check constraints for valid flexibility values

## Example Usage in Coordinator

1. **View Patients** → Click patient name
2. **Set Preferences** → Open "Edit Visit Preferences"
3. **Specify Time & Flexibility**:
   - Time: `14:00` (2 PM)
   - Flexibility: `fixed` (for medication)
   - Notes: "Blood pressure medication at 2 PM"
4. **Save** → Preferences stored
5. **Auto Assign** → AI respects these settings

## Console Logging

When assigning, you'll see logs like:
```
🏥 Assigning patient 5. Preferred time: 14:00 (fixed)
✓ Found PREFERRED slot on 2024-12-31 at 14:10 ✓
```

vs without preference:
```
✓ Found available slot on 2024-12-31 at 09:00 (not ideal for preference, but available)
```

## Benefits

✅ **Patient Satisfaction** - Respects their schedules
✅ **Clinical Accuracy** - Enforces medication/therapy timing
✅ **Fewer Conflicts** - Avoids scheduling during work/activities
✅ **Better Outcomes** - Care at optimal times
✅ **Coordinator Control** - Can override flexibility if needed

## Future Enhancements

- [ ] Recurring availability patterns (e.g., "patient always busy Tuesdays")
- [ ] Multiple time slots per week
- [ ] Integration with patient calendar/work schedule
- [ ] Automatic conflict detection
- [ ] Patient self-scheduling interface
