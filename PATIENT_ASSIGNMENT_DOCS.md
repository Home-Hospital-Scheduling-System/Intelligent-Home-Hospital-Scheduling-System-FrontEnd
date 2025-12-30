# Patient Assignment System Documentation

## Overview
This system intelligently assigns patients to healthcare professionals based on:
- **Geographic proximity** (Patient area matches professional's service area)
- **Expertise match** (Professional has required certifications)
- **Availability** (Professional has free hours in their shift)
- **Workload balance** (Professional isn't overbooked)

## System Components

### 1. **Assignment Engine** (`assignmentEngine.js`)
Core algorithm for matching patients to professionals.

**Key Functions:**
- `calculateMatchScore(patient, professional)` - Scores 0-100
- `suggestProfessionalsForPatient(patient)` - Returns top 5 matches
- `createPatientAssignment(...)` - Creates assignment record
- `reassignPatient(...)` - Reassigns to different professional
- `getProfessionalPatients(professionalId)` - Gets assigned patients

**Match Score Formula:**
```
Score = (Area Match × 40%) + (Expertise × 35%) + (Availability × 15%) + (Workload × 10%)
```

### 2. **UI Components**

#### **AssignPatient.jsx**
Used by coordinators to assign patients to professionals.

Features:
- Shows patient information
- Lists 10 best-matching professionals with scores
- Shows professional workload and availability
- Optional assignment reason field
- Real-time assignment creation

Usage:
```jsx
<AssignPatient 
  patientId="uuid"
  onAssigned={() => loadPatients()}
  onClose={() => setShowModal(false)}
/>
```

#### **ProfessionalSetup.jsx**
Allows professionals to set their specializations and service areas.

Features:
- Add/remove specializations from predefined list
- Add/remove service areas (Oulu districts)
- Mark primary service area
- Real-time database sync

Usage:
```jsx
<ProfessionalSetup 
  professionalId="uuid"
  onClose={() => setShowModal(false)}
/>
```

#### **PatientAssignmentManager.jsx**
Coordinator dashboard for managing all patient assignments.

Features:
- View unassigned patients
- View assigned patients
- Filter by area
- Quick assignment action
- Shows assignment counts

Usage:
```jsx
<PatientAssignmentManager profile={userProfile} />
```

### 3. **Database Schema**

#### **professional_specializations**
```sql
- id (UUID, PK)
- professional_id (FK to professionals)
- specialization (String: Wound Care, Physical Therapy, etc.)
- years_experience (Integer)
- certification_date (Timestamp)
```

#### **professional_service_areas**
```sql
- id (UUID, PK)
- professional_id (FK to professionals)
- service_area (String: Oulu districts)
- is_primary (Boolean)
```

#### **patient_assignments**
```sql
- id (UUID, PK)
- patient_id (FK to patients)
- professional_id (FK to professionals)
- assigned_by_id (FK to profiles - coordinator)
- assignment_date (Timestamp)
- start_date (Date)
- end_date (Date)
- status (active, completed, reassigned, cancelled)
- assignment_reason (String)
- match_score (0-100 Integer)
- notes (Text)
```

#### **assignment_history**
```sql
- id (UUID, PK)
- patient_id (FK to patients)
- previous_professional_id (FK to professionals)
- new_professional_id (FK to professionals)
- changed_by_id (FK to profiles)
- reason (String)
- changed_at (Timestamp)
```

#### **Updated professionals table**
Added columns:
- `max_daily_hours` (Default: 8)
- `max_patients` (Default: 20)
- `current_patient_count` (Default: 0)

## Workflow

### Step 1: Professional Setup
1. Professional logs in
2. Goes to profile settings
3. Adds specializations (e.g., Wound Care, Physical Therapy)
4. Adds service areas (Oulu districts)
5. Marks primary service area

### Step 2: Supervisor Assigns Duty Hours
1. Supervisor views professionals
2. Assigns working hours (e.g., 8 hours/day)
3. Sets max patient capacity (e.g., 20 patients)

### Step 3: Coordinator Assigns Patients
1. Coordinator opens PatientAssignmentManager
2. Views unassigned patients
3. Clicks "Assign" on a patient
4. System suggests top 5 professionals with match scores
5. Coordinator selects professional + adds reason
6. Assignment created and recorded

### Step 4: Automatic Updates
- Professional's current_patient_count increments
- Professional's assigned_hours updated
- Assignment recorded with match score
- History log created for audit trail

## Matching Algorithm Details

### Area Match (40%)
- Check if professional serves patient's area
- Professional must have area in `professional_service_areas` table
- Full 40 points if match, 0 if no match

### Expertise Match (35%)
- Extract skills from care type (e.g., "Wound Care" → ["Wound Care", "Nursing Care"])
- Check professional's `professional_specializations`
- 35 points if any skill matches, 20 points if partial
- Different care types map to different skill requirements

### Availability Match (15%)
- Get professional's `max_daily_hours` and `assigned_hours`
- Calculate: `available_hours = max_daily_hours - assigned_hours`
- 15 points if available_hours > 0, 5 points otherwise

### Workload Balance (10%)
- Calculate utilization: `current_patient_count / max_patients`
- Score: `(1 - utilization) * 10`
- Lower utilization = higher score
- Ensures even distribution of patients

## Examples

### Example 1: Assign Patient with Wound Care Need
```
Patient: John (Area: Keskusta, Care: Wound Dressing)

Matching:
1. Dr. Sarah (Score: 92%)
   - ✓ Serves Keskusta (40)
   - ✓ Specialization: Wound Care (35)
   - ✓ 2 hours available (15)
   - ✓ 15% utilization (2)

2. Dr. Michael (Score: 78%)
   - ✓ Serves Keskusta (40)
   - ✓ Specialization: Nursing Care (20)
   - ✓ 4 hours available (15)
   - ✓ 3% utilization (3)

3. Nurse Emma (Score: 65%)
   - ✗ Serves North District (0)
   - ✓ Specialization: Wound Care (35)
   - ✓ 6 hours available (15)
   - ✓ 25% utilization (15)
```

### Example 2: Reassign Patient
```
Patient: Jane (Currently: Dr. Robert)
New Professional: Dr. Sarah

Old Status: active → reassigned
New Assignment: Dr. Sarah (active)
History Entry: Robert → Sarah (Reason: "More experienced in post-op care")
```

## API Integration Ready

The system is structured to easily integrate with AI APIs:

```javascript
// Future: Call AI API for enhanced matching
async function getAIMatchScore(patient, professional) {
  const response = await fetch('https://your-ai-api.com/match', {
    method: 'POST',
    body: JSON.stringify({ patient, professional })
  })
  return response.json().score
}
```

## Database Migration

Run this SQL to set up the tables:
```sql
-- Execute migration_patient_assignment.sql
```

Use Supabase SQL editor or run from CLI:
```bash
psql -h <host> -U postgres -d <database> -f migration_patient_assignment.sql
```

## Future Enhancements

1. **AI Integration**
   - Call AI API for enhanced matching
   - Learn from successful assignments
   - Predict patient needs

2. **Advanced Scheduling**
   - Time-slot based assignments
   - Route optimization for home visits
   - Travel time considerations

3. **Performance Analytics**
   - Track assignment success rates
   - Measure patient satisfaction
   - Professional utilization metrics

4. **Automated Reassignment**
   - Auto-reassign if professional unavailable
   - Load balancing across team
   - Skill-based routing

## Error Handling

All components include:
- Try-catch error blocks
- User-friendly error messages
- Validation before database operations
- Rollback on failure

## Security

- All operations tied to authenticated user
- Audit trail via `assignment_history`
- Professional privacy maintained
- Patient data protected
