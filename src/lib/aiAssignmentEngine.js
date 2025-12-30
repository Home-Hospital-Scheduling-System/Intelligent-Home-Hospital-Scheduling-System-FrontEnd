import { supabase } from './supabaseClient'
import { smartAssignPatient } from './timeSlotOptimizer'

// Helper: Calculate skill match score (0-100)
function calculateSkillMatch(patientCareNeeded, professionalSpecializations) {
  if (!patientCareNeeded || !professionalSpecializations || professionalSpecializations.length === 0) {
    return 0
  }

  // Direct specialty match
  const directMatch = professionalSpecializations.some(spec => 
    spec.specialization.toLowerCase() === patientCareNeeded.toLowerCase()
  )
  if (directMatch) return 100

  // Partial match (keyword overlap)
  const careWords = patientCareNeeded.toLowerCase().split(/\s+/)
  const matchCount = professionalSpecializations.filter(spec => {
    const specWords = spec.specialization.toLowerCase().split(/\s+/)
    return careWords.some(word => specWords.includes(word))
  }).length

  if (matchCount > 0) return 75

  // Category match (nursing vs doctor)
  return 0
}

// Helper: Calculate availability score (0-100)
function calculateAvailabilityScore(currentPatientCount, maxPatients, workingHours) {
  if (!workingHours || workingHours.length === 0) return 0

  // Capacity utilization (lower is better)
  const capacityRatio = currentPatientCount / maxPatients
  const capacityScore = Math.max(0, 100 - (capacityRatio * 100))

  // Frequency of shifts (more shifts = more availability)
  const shiftFrequency = workingHours.length * 20 // 20 points per shift day

  return (capacityScore * 0.7) + Math.min(shiftFrequency, 30)
}

// Helper: Calculate service area match score (0-100)
function calculateServiceAreaMatch(patientArea, professionalServiceAreas) {
  if (!patientArea || !professionalServiceAreas || professionalServiceAreas.length === 0) {
    return 0
  }

  // Exact match in service areas
  const exactMatch = professionalServiceAreas.some(area => 
    area.service_area.toLowerCase() === patientArea.toLowerCase()
  )
  if (exactMatch) return 100

  // Primary service area match (higher priority)
  const primaryMatch = professionalServiceAreas.some(area => 
    area.service_area.toLowerCase() === patientArea.toLowerCase() && area.is_primary
  )
  if (primaryMatch) return 100

  // In any service area but not primary
  return 60
}

// Helper: Calculate geographic clustering bonus (0-30 points)
// Check how many existing patients this professional has in the same area
function calculateGeographicClusteringBonus(patientArea, assignedPatients) {
  if (!assignedPatients || assignedPatients.length === 0) {
    return 0 // No bonus if no existing patients
  }

  const patientsInSameArea = assignedPatients.filter(assignment => {
    // Handle nested patient object from Supabase relation
    const patient = assignment.patients
    return patient && patient.service_area && 
           patient.service_area.toLowerCase() === patientArea.toLowerCase()
  }).length

  // Bonus calculation: +2 points per existing patient in same area (max 20 points)
  const bonus = Math.min(patientsInSameArea * 2, 20)
  
  if (bonus > 0) {
    console.log(`✓ Geographic clustering: Patient in ${patientArea}, professional has ${patientsInSameArea} patients in same area, bonus: +${bonus}`)
  }
  
  return bonus
}

// Main AI matching function
export async function findBestMatches(patientId) {
  try {
    // Fetch patient details
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      console.error('Error fetching patient:', patientError)
      return []
    }

    console.log(`\n🔍 Finding best matches for patient ${patientId} in area: ${patient.area}`)

    // Fetch all active professionals with their details
    const { data: professionals, error: profsError } = await supabase
      .from('professionals')
      .select(`
        id,
        profile_id,
        kind,
        specialty,
        max_patients,
        current_patient_count,
        is_active,
        profiles(full_name)
      `)
      .eq('is_active', true)
      .order('current_patient_count', { ascending: true })

    if (profsError || !professionals) {
      console.error('Error fetching professionals:', profsError)
      return []
    }

    // For each professional, calculate match score
    const matches = await Promise.all(
      professionals.map(async (prof) => {
        // Skip if at capacity
        if (prof.current_patient_count >= prof.max_patients) {
          return null
        }

        // Fetch specializations
        const { data: specializations } = await supabase
          .from('professional_specializations')
          .select('specialization')
          .eq('professional_id', prof.id)

        // Fetch service areas
        const { data: serviceAreas } = await supabase
          .from('professional_service_areas')
          .select('service_area, is_primary')
          .eq('professional_id', prof.id)

        // Fetch working hours
        const { data: workingHours } = await supabase
          .from('working_hours')
          .select('weekday, start_time, end_time')
          .eq('professional_id', prof.id)

        // Fetch already assigned patients to check for geographic clustering
        const { data: assignedPatients, error: assignError } = await supabase
          .from('patient_assignments')
          .select('id')
          .eq('professional_id', prof.id)
          .eq('status', 'active')

        // If we have assigned patients, fetch their locations
        let assignedPatientsWithLocations = []
        if (assignedPatients && assignedPatients.length > 0) {
          const assignmentIds = assignedPatients.map(a => a.id)
          const { data: detailedAssignments } = await supabase
            .from('patient_assignments')
            .select('patients!patient_id(id, service_area)')
            .in('id', assignmentIds)
          
          assignedPatientsWithLocations = detailedAssignments || []
        }

        // Calculate individual scores
        const skillScore = calculateSkillMatch(patient.care_needed, specializations)
        const availabilityScore = calculateAvailabilityScore(
          prof.current_patient_count,
          prof.max_patients,
          workingHours
        )
        const areaScore = calculateServiceAreaMatch(patient.area, serviceAreas)
        
        // New: Geographic clustering bonus - assign to professionals already serving this area
        const clusteringBonus = calculateGeographicClusteringBonus(patient.area, assignedPatientsWithLocations)

        // Weighted final score
        // 40% skill match, 30% availability, 20% location, +clustering bonus
        const baseScore = (skillScore * 0.4) + (availabilityScore * 0.3) + (areaScore * 0.2)
        const finalScore = baseScore + clusteringBonus

        return {
          professional_id: prof.id,
          professional_name: prof.profiles.full_name,
          kind: prof.kind,
          specialty: prof.specialty,
          skillScore: Math.round(skillScore),
          availabilityScore: Math.round(availabilityScore),
          areaScore: Math.round(areaScore),
          clusteringBonus: Math.round(clusteringBonus),
          finalScore: Math.round(finalScore),
          currentPatients: prof.current_patient_count,
          maxPatients: prof.max_patients,
          availableSlots: prof.max_patients - prof.current_patient_count,
          reasoning: generateReasoning(skillScore, availabilityScore, areaScore, clusteringBonus, prof)
        }
      })
    )

    // Filter out nulls and sort by final score
    const results = matches
      .filter(m => m !== null)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 5) // Return top 5 matches

    console.log(`✓ Found ${results.length} matching professionals`)
    return results

  } catch (err) {
    console.error('Unexpected error in findBestMatches:', err)
    return []
  }
}

// Generate human-readable reasoning for the match
function generateReasoning(skillScore, availabilityScore, areaScore, clusteringBonus, prof) {
  const reasons = []

  if (skillScore >= 75) {
    reasons.push('✓ Strong skill match')
  } else if (skillScore > 0) {
    reasons.push('△ Partial skill match')
  }

  if (availabilityScore >= 70) {
    reasons.push('✓ High availability')
  } else if (availabilityScore >= 50) {
    reasons.push('△ Good availability')
  }

  if (areaScore >= 80) {
    reasons.push('✓ Service area coverage')
  } else if (areaScore > 0) {
    reasons.push('△ Partial area coverage')
  }

  if (clusteringBonus >= 10) {
    reasons.push('✓ Geographic clustering (nearby patients)')
  } else if (clusteringBonus > 0) {
    reasons.push('△ Some nearby patients assigned')
  }

  if (prof.availableSlots <= 2) {
    reasons.push('⚠ Limited slots available')
  }

  return reasons.join(', ') || 'Good match'
}

// Auto-assign patient to best match with intelligent time slot scheduling
export async function autoAssignPatient(patientId, assignedById, existingAssignments = []) {
  try {
    console.log(`\n🏥 AUTO-ASSIGN START: Patient ${patientId}`)
    
    // Get best matches
    const matches = await findBestMatches(patientId)
    console.log(`Found ${matches ? matches.length : 0} potential matches`)

    if (!matches || matches.length === 0) {
      console.error('❌ No suitable professionals found')
      return {
        success: false,
        message: 'No suitable professionals found for this patient',
        error: 'NO_MATCHES'
      }
    }

    // Use the best match (highest score)
    const bestMatch = matches[0]
    const professionalId = bestMatch.professional_id
    console.log(`✓ Best match: ${bestMatch.professional_name} (Score: ${bestMatch.finalScore})`)

    // Use smart scheduling instead of createPatientAssignment
    console.log(`⏱️  Starting smart time slot scheduling...`)
    const result = await smartAssignPatient(patientId, professionalId, assignedById, existingAssignments)

    if (result.success) {
      console.log(`✓ Assignment successful!`)
      return {
        success: true,
        message: `Successfully assigned to ${bestMatch.professional_name}`,
        assignment: result.assignment,
        scheduledDetails: result.scheduledDetails,
        matchDetails: {
          professional: bestMatch.professional_name,
          finalScore: bestMatch.finalScore,
          skillMatch: bestMatch.skillScore,
          availability: bestMatch.availabilityScore,
          areaMatch: bestMatch.areaScore,
          clusteringBonus: bestMatch.clusteringBonus,
          reasoning: bestMatch.reasoning
        }
      }
    } else {
      console.error('❌ Assignment failed:', result.error)
      return {
        success: false,
        message: result.error || 'Failed to create assignment',
        error: result.error
      }
    }

  } catch (err) {
    console.error('❌ Error in autoAssignPatient:', err)
    return {
      success: false,
      message: 'An unexpected error occurred: ' + err.message,
      error: err.message
    }
  }
}

// Batch auto-assign multiple patients (for coordinator to review before confirming)
export async function generateAssignmentSuggestions(patientIds, assignedById) {
  try {
    const suggestions = await Promise.all(
      patientIds.map(async (patientId) => {
        const matches = await findBestMatches(patientId)
        return {
          patientId,
          matches
        }
      })
    )

    return {
      success: true,
      suggestions,
      totalPatients: patientIds.length
    }

  } catch (err) {
    console.error('Error generating suggestions:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

// Get AI insights about patient-professional match
export async function getMatchInsights(patientId, professionalId) {
  try {
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    const { data: professional } = await supabase
      .from('professionals')
      .select(`
        *,
        profiles(full_name)
      `)
      .eq('id', professionalId)
      .single()

    const { data: specializations } = await supabase
      .from('professional_specializations')
      .select('specialization')
      .eq('professional_id', professionalId)

    const { data: serviceAreas } = await supabase
      .from('professional_service_areas')
      .select('service_area, is_primary')
      .eq('professional_id', professionalId)

    const { data: workingHours } = await supabase
      .from('working_hours')
      .select('weekday, start_time, end_time')
      .eq('professional_id', professionalId)

    const skillScore = calculateSkillMatch(patient.care_needed, specializations)
    const availabilityScore = calculateAvailabilityScore(
      professional.current_patient_count,
      professional.max_patients,
      workingHours
    )
    const areaScore = calculateServiceAreaMatch(patient.area, serviceAreas)

    return {
      patientName: patient.name,
      patientCareNeeded: patient.care_needed,
      patientArea: patient.area,
      professionalName: professional.profiles.full_name,
      professionalSpecialty: professional.specialty,
      matchScores: {
        skill: skillScore,
        availability: availabilityScore,
        area: areaScore,
        overall: Math.round((skillScore * 0.4) + (availabilityScore * 0.3) + (areaScore * 0.3))
      },
      insights: {
        matchingSpecializations: specializations.filter(s => 
          patient.care_needed && patient.care_needed.toLowerCase().includes(s.specialization.toLowerCase())
        ),
        serveThisArea: serviceAreas.some(a => a.service_area === patient.area),
        availableCapacity: professional.max_patients - professional.current_patient_count,
        workingDays: workingHours.length
      }
    }

  } catch (err) {
    console.error('Error getting match insights:', err)
    return null
  }
}
