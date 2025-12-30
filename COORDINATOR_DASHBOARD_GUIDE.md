# Coordinator Dashboard - Patient Assignment Manager

## ✅ Now Live in App.jsx!

The PatientAssignmentManager is now integrated into the application routing system.

## How to Access

### For Coordinators:
1. Log in with role: **"coordinator"**
2. You'll automatically see the **Patient Assignment Manager** dashboard
3. The dashboard replaces the old CoordinatorSchedules view

## What You Can Do

### 📋 **Unassigned Patients Tab**
**View all patients waiting for assignment**

Features:
- List of all patients not yet assigned to any professional
- Shows patient details:
  - Name, Phone, Address
  - Area (Oulu district)
  - Care type needed
- **"Assign →" button** for quick assignment
- **Area filter** to narrow down search

**Workflow:**
1. See unassigned patient
2. Click "Assign →" button
3. System suggests top 5 professionals
4. Select professional
5. Add optional reason
6. Confirm assignment

### ✓ **Assigned Patients Tab**
**View all patients already assigned to professionals**

Features:
- List of patients with active assignments
- Shows:
  - Patient name, phone, address
  - Assigned area
  - Care type
  - Green highlight (active assignment)
- **Area filter** to search by location
- View-only (no changes from here)

### 🎓 **Professional Setup** (Optional Feature)
Not in main dashboard but available as standalone component:
- Add specializations (Wound Care, Nursing, etc.)
- Add service areas (Oulu districts)
- Mark primary service areas

## Professional Suggestion Algorithm

When you click "Assign" on a patient, the system automatically suggests professionals based on:

### Match Score (0-100%)
- **40%** - Area match (professional serves that Oulu district)
- **35%** - Expertise match (has required specializations)
- **15%** - Availability (has free hours in their shift)
- **10%** - Workload balance (not overbooked)

### Example:
```
Patient: John (Keskusta area, needs Wound Care)

Top Match: Dr. Sarah (92%)
- ✓ Serves Keskusta
- ✓ Specialization: Wound Care
- ✓ 2 hours available
- ✓ Low patient load (15%)
```

## Database Integration

All assignments are stored in:
- `patient_assignments` - Active assignments
- `assignment_history` - Audit trail of changes
- `professional_specializations` - Professional skills
- `professional_service_areas` - Service coverage areas

## User Roles & Access

| Role | Sees | Can Do |
|------|------|--------|
| **Coordinator** | PatientAssignmentManager | Assign patients, view stats |
| **Supervisor** | SupervisorDashboard | Assign duty hours, manage professionals |
| **Professional** | ProfessionalView | View own patients, update treatment |
| **Patient** | PatientView | View own appointments |

## Step-by-Step: Assign a Patient

1. **Login as Coordinator**
   - Email: coordinator@example.com
   - Role: coordinator

2. **View Dashboard**
   - See "Unassigned Patients" tab (default)
   - Shows 5+ unassigned patients

3. **Filter (Optional)**
   - Select area from dropdown
   - Filter by Oulu district

4. **Click "Assign →"**
   - Modal opens with patient details
   - Shows 10 suggested professionals
   - Green cards = good match (80%+)
   - Yellow cards = fair match (60-79%)
   - Red cards = poor match (<60%)

5. **Select Professional**
   - Click on professional card
   - Card highlights in blue

6. **Add Reason (Optional)**
   - "Specialized in wound care"
   - "Nearest to patient"
   - "Best availability"

7. **Click "Assign Professional"**
   - Assignment created
   - Success message appears
   - Dashboard updates automatically

8. **Verify Assignment**
   - Switch to "Assigned Patients" tab
   - See your newly assigned patient

## Match Score Explanation

### ✅ Green (80-100%)
Best match - professional has all requirements + availability + low workload

### 🟡 Yellow (60-79%)
Good match - professional has most requirements but higher workload or lower availability

### 🔴 Red (0-59%)
Partial match - professional has some skills but not ideal area or availability

## Common Scenarios

### Scenario 1: Assign Wound Care Patient
```
Patient: Jane (Keskusta, Wound Dressing)
Best Match: Nurse Maria (95%)
- ✓ Serves Keskusta (40)
- ✓ Wound Care specialization (35)
- ✓ 3 hours free (15)
- ✓ 5 patients of 20 max (5)
```

### Scenario 2: Assign to Busy Area
```
Patient: Bob (Tuira, Physical Therapy)
Available: Dr. John (65%)
- ✓ Serves Tuira (40)
- ✓ Physical Therapy (35)
- ✗ Only 1 hour free (5)
- ✗ 18 of 20 patients (5)
```

## Tips for Better Assignments

1. **Set up professionals first**
   - Add their specializations
   - Add their service areas
   - Set max hours and patient capacity

2. **Review match scores**
   - Don't always pick the top match
   - Consider geographic distance
   - Balance workload across team

3. **Use the reason field**
   - Document why you chose this professional
   - Helps with auditing and improvements
   - Useful for team communication

4. **Check assignment history**
   - View past assignments in audit trail
   - See what worked and what didn't
   - Plan better assignments

## Future Enhancements

- [ ] Batch assign multiple patients
- [ ] Reassign patients to different professionals
- [ ] View assignment history with reasons
- [ ] AI-powered auto-assignment
- [ ] Load balancing across team
- [ ] Performance metrics per professional

## Troubleshooting

**Q: No professionals showing up?**
A: Professionals haven't set up their specializations and service areas yet. Have them use ProfessionalSetup component.

**Q: Low match scores for all professionals?**
A: Check if professionals serve the patient's area. Add service areas in ProfessionalSetup.

**Q: Professional workload looks full?**
A: Supervisor needs to increase max_patients or assign different work hours.

---

**Ready to start assigning patients!** 🚀
