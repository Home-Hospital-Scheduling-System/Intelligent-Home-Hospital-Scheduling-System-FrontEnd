// assignmentEngine.js
// Smart patient-to-professional assignment matching algorithm

import { supabase } from '../lib/supabaseClient'

/**
 * Calculate match score between a patient and professional
 * Score factors:
 * - Area match (40%)
 * - Expertise match (35%)
 * - Availability (15%)
 * - Workload balance (10%)
 */
export async function calculateMatchScore(patient, professional) {
  let score = 0

  // 1. Area Match (40%)
  const areaMatch = await checkAreaMatch(patient.area, professional.id)
  const areaScore = areaMatch ? 40 : 0
  score += areaScore

  // 2. Expertise Match (35%)
  const expertiseMatch = await checkExpertiseMatch(patient.care_needed, professional.id)
  const expertiseScore = expertiseMatch ? 35 : 20 // 35 if match, 20 partial
  score += expertiseScore

  // 3. Availability (15%)
  const availabilityMatch = await checkAvailability(professional.id)
  const availabilityScore = availabilityMatch ? 15 : 5
  score += availabilityScore

  // 4. Workload Balance (10%)
  const workloadScore = await getWorkloadScore(professional.id)
  score += workloadScore

  return Math.min(score, 100) // Cap at 100
}

/**
 * Check if professional serves the patient's area
 */
async function checkAreaMatch(patientArea, professionalId) {
  try {
    const { data, error } = await supabase
      .from('professional_service_areas')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('service_area', patientArea)
      .single()

    return !error && data
  } catch (err) {
    console.error('Error checking area match:', err)
    return false
  }
}

/**
 * Check if professional has required expertise for care type
 */
async function checkExpertiseMatch(careNeeded, professionalId) {
  try {
    // Extract key skill from care type
    const skills = extractSkillsFromCareType(careNeeded)

    const { data, error } = await supabase
      .from('professional_specializations')
      .select('*')
      .eq('professional_id', professionalId)
      .in('specialization', skills)

    return !error && data && data.length > 0
  } catch (err) {
    console.error('Error checking expertise match:', err)
    return false
  }
}

/**
 * Check if professional has available hours
 */
async function checkAvailability(professionalId) {
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('assigned_hours, max_daily_hours')
      .eq('id', professionalId)
      .single()

    if (error) return false

    const availableHours = data.max_daily_hours - (data.assigned_hours || 0)
    return availableHours > 0
  } catch (err) {
    console.error('Error checking availability:', err)
    return false
  }
}

/**
 * Calculate workload score (10 points max)
 * Professionals with lower workload get higher score
 */
async function getWorkloadScore(professionalId) {
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('current_patient_count, max_patients')
      .eq('id', professionalId)
      .single()

    if (error) return 0

    const utilization = data.current_patient_count / data.max_patients
    // Lower utilization = higher score
    return Math.round((1 - utilization) * 10)
  } catch (err) {
    console.error('Error calculating workload score:', err)
    return 5 // Default to middle score
  }
}

/**
 * Extract skills needed from care type description
 */
function extractSkillsFromCareType(careNeeded) {
  const skillMap = {
    'Wound Dressing': ['Wound Care', 'Nursing Care'],
    'Physical Therapy': ['Physical Therapy', 'Rehabilitation'],
    'Medication Administration': ['Nursing Care', 'Medication Management'],
    'Nursing Care': ['Nursing Care'],
    'Occupational Therapy': ['Occupational Therapy'],
    'Home Health Aide': ['Home Health', 'Elderly Care'],
    'Speech Therapy': ['Speech Therapy'],
    'Respiratory Care': ['Respiratory Care'],
    'Palliative Care': ['Palliative Care', 'Nursing Care'],
    'Post-operative Care': ['Post-operative Care', 'Nursing Care'],
    'Chronic Disease Management': ['Chronic Disease Management'],
    'Elderly Care': ['Elderly Care'],
    'Diabetic Care': ['Diabetic Care'],
    'Cardiac Care': ['Cardiac Care'],
    'Home Visit - General Checkup': ['Nursing Care'],
    'Home Visit - Blood Pressure Monitoring': ['Cardiovascular Assessment'],
    'Home Visit - Wound Care': ['Wound Care'],
    'Home Visit - Medication Management': ['Medication Management'],
    'Home Visit - Post-Surgery Follow-up': ['Post-operative Care'],
    'Hospital at Home - Acute Care': ['Acute Care', 'Nursing Care'],
    'Hospital at Home - Chronic Disease Management': ['Chronic Disease Management'],
    'Hospital at Home - Rehabilitation': ['Rehabilitation'],
    'Hospital at Home - Palliative Care': ['Palliative Care'],
    'Hospital at Home - Post-Hospitalization Recovery': ['Post-operative Care']
  }

  return skillMap[careNeeded] || ['General Care']
}

/**
 * Get list of available professionals for patient assignment
 */
export async function getAvailableProfessionals(patientArea) {
  try {
    // Get professionals serving this area
    const { data: areaData, error: areaError } = await supabase
      .from('professional_service_areas')
      .select('professional_id')
      .eq('service_area', patientArea)

    if (areaError) throw areaError

    const professionalIds = areaData.map(record => record.professional_id)

    if (professionalIds.length === 0) {
      return []
    }

    // Get professional details
    const { data: professionals, error: profError } = await supabase
      .from('professionals')
      .select('*, profiles(full_name, email)')
      .in('id', professionalIds)
      .eq('is_active', true)

    if (profError) throw profError

    return professionals || []
  } catch (err) {
    console.error('Error getting available professionals:', err)
    return []
  }
}

/**
 * Suggest best professionals for a patient
 */
export async function suggestProfessionalsForPatient(patient, limit = 5) {
  try {
    const availableProfessionals = await getAvailableProfessionals(patient.area)

    // Calculate match scores
    const scoredProfessionals = await Promise.all(
      availableProfessionals.map(async (prof) => ({
        ...prof,
        matchScore: await calculateMatchScore(patient, prof)
      }))
    )

    // Sort by match score descending
    return scoredProfessionals
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
  } catch (err) {
    console.error('Error suggesting professionals:', err)
    return []
  }
}

/**
 * Create patient assignment with scheduled visit time
 */
export async function createPatientAssignment(patientId, professionalId, assignedById, reason = '') {
  try {
    // Get patient details
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('area')
      .eq('id', patientId)
      .single()

    if (patientError) throw patientError

    // Get professional's working hours to determine visit time
    const visitTimeInfo = await scheduleVisitTime(professionalId, patientData.area)

    // Create assignment record with visit time
    const { data, error } = await supabase
      .from('patient_assignments')
      .insert({
        patient_id: patientId,
        professional_id: professionalId,
        assigned_by_id: assignedById,
        assignment_date: new Date().toISOString(),
        scheduled_visit_date: visitTimeInfo.visitDate,
        scheduled_visit_time: visitTimeInfo.visitTime,
        service_area: patientData.area,
        assignment_reason: reason,
        status: 'active'
      })
      .select()

    if (error) throw error

    // Update professional's current patient count
    await supabase.rpc('increment_professional_patient_count', {
      p_professional_id: professionalId
    })

    // Record in assignment history
    await supabase
      .from('assignment_history')
      .insert({
        patient_id: patientId,
        new_professional_id: professionalId,
        changed_by_id: assignedById,
        reason: reason
      })

    return data[0]
  } catch (err) {
    console.error('Error creating assignment:', err)
    throw err
  }
}

/**
 * Schedule visit time based on professional's availability
 * Returns the next available time in professional's shift for the service area
 */
async function scheduleVisitTime(professionalId, serviceArea) {
  try {
    // Get professional's working hours
    const { data: workingHours, error: whError } = await supabase
      .from('working_hours')
      .select('*')
      .eq('professional_id', professionalId)
      .order('weekday', { ascending: true })

    if (whError) throw whError

    // Get the next working day (skip weekends if needed)
    const today = new Date()
    let nextDay = new Date(today)
    let attempts = 0
    const maxAttempts = 14 // Check next 2 weeks

    while (attempts < maxAttempts) {
      nextDay.setDate(nextDay.getDate() + 1)
      const dayOfWeek = nextDay.getDay() === 0 ? 7 : nextDay.getDay() // Convert JS day (0-6) to SQL format (1-7, Monday=1)
      
      // Check if professional works on this day
      const daySchedule = workingHours.find(wh => wh.weekday === dayOfWeek)
      if (daySchedule) {
        // Use start time of shift as visit time
        const visitDate = nextDay.toISOString().split('T')[0] // YYYY-MM-DD format
        return {
          visitDate,
          visitTime: daySchedule.start_time // Use the shift start time
        }
      }
      
      attempts++
    }

    // Fallback if no schedule found
    const fallbackDate = new Date(today)
    fallbackDate.setDate(fallbackDate.getDate() + 1)
    const fallbackVisitDate = fallbackDate.toISOString().split('T')[0]

    return {
      visitDate: fallbackVisitDate,
      visitTime: '09:00:00'
    }
  } catch (err) {
    console.error('Error scheduling visit time:', err)
    // Return default next day at 9 AM
    const nextDay = new Date()
    nextDay.setDate(nextDay.getDate() + 1)
    return {
      visitDate: nextDay.toISOString().split('T')[0],
      visitTime: '09:00:00'
    }
  }
}

/**
 * Reassign patient to different professional
 */
export async function reassignPatient(patientId, newProfessionalId, changedById, reason = '') {
  try {
    // Get current assignment
    const { data: currentAssignment, error: fetchError } = await supabase
      .from('patient_assignments')
      .select('professional_id')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .single()

    if (fetchError) throw fetchError

    const oldProfessionalId = currentAssignment.professional_id

    // Update assignment to new professional
    const { data, error } = await supabase
      .from('patient_assignments')
      .update({ status: 'reassigned', updated_at: new Date().toISOString() })
      .eq('patient_id', patientId)
      .eq('professional_id', oldProfessionalId)
      .select()

    if (error) throw error

    // Create new assignment
    await createPatientAssignment(patientId, newProfessionalId, changedById, reason)

    // Record in history
    await supabase
      .from('assignment_history')
      .insert({
        patient_id: patientId,
        previous_professional_id: oldProfessionalId,
        new_professional_id: newProfessionalId,
        changed_by_id: changedById,
        reason: reason
      })

    return data[0]
  } catch (err) {
    console.error('Error reassigning patient:', err)
    throw err
  }
}

/**
 * Get all patients assigned to a professional
 */
export async function getProfessionalPatients(professionalId) {
  try {
    const { data, error } = await supabase
      .from('patient_assignments')
      .select('patient_id, patients(*)')
      .eq('professional_id', professionalId)
      .eq('status', 'active')

    if (error) throw error

    return data.map(record => record.patients)
  } catch (err) {
    console.error('Error getting professional patients:', err)
    return []
  }
}
