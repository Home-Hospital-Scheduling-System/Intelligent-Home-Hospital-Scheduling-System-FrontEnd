import { supabase } from './supabaseClient'

/**
 * Advanced AI Assignment with Time Slot & Route Optimization
 */

// Time slot configurations
const CARE_DURATION = {
  'Wound Dressing': 45,
  'Wound Care Specialist': 45,
  'Post-operative Care': 60,
  'IV Therapy Specialist': 45,
  'Medication Administration': 30,
  'Palliative Care': 60,
  'Respiratory Care': 45,
  'Diabetic Care': 40,
  'Elderly Care': 50,
  'Home Health Aide': 45,
  'Nursing Care': 50,
  'Physical Therapy': 60,
  'Chronic Disease Management': 45,
  'Home Visit - General Checkup': 30,
  'Cardiac Care': 45,
  'default': 45
}

// Travel time between zones (in minutes)
const TRAVEL_TIME = {
  'Keskusta (City Center)': {
    'Keskusta (City Center)': 0,
    'Raksila': 15,
    'Tuira': 20,
    'Meri-Oulu': 25,
    'Pateniemi': 30,
    'Pohjois-Oulu': 25,
    'Kontinkangas': 20,
    'Kaakkuri': 15,
    'Myllyoja': 10
  },
  'Raksila': {
    'Keskusta (City Center)': 15,
    'Raksila': 0,
    'Tuira': 10,
    'Meri-Oulu': 20,
    'Pateniemi': 25,
    'Pohjois-Oulu': 20,
    'Kontinkangas': 15,
    'Kaakkuri': 20,
    'Myllyoja': 10
  },
  'Tuira': {
    'Keskusta (City Center)': 20,
    'Raksila': 10,
    'Tuira': 0,
    'Meri-Oulu': 15,
    'Pateniemi': 20,
    'Pohjois-Oulu': 15,
    'Kontinkangas': 20,
    'Kaakkuri': 25,
    'Myllyoja': 20
  },
  'Meri-Oulu': {
    'Keskusta (City Center)': 25,
    'Raksila': 20,
    'Tuira': 15,
    'Meri-Oulu': 0,
    'Pateniemi': 10,
    'Pohjois-Oulu': 20,
    'Kontinkangas': 30,
    'Kaakkuri': 35,
    'Myllyoja': 30
  },
  'Pateniemi': {
    'Keskusta (City Center)': 30,
    'Raksila': 25,
    'Tuira': 20,
    'Meri-Oulu': 10,
    'Pateniemi': 0,
    'Pohjois-Oulu': 25,
    'Kontinkangas': 35,
    'Kaakkuri': 40,
    'Myllyoja': 35
  },
  'Pohjois-Oulu': {
    'Keskusta (City Center)': 25,
    'Raksila': 20,
    'Tuira': 15,
    'Meri-Oulu': 20,
    'Pateniemi': 25,
    'Pohjois-Oulu': 0,
    'Kontinkangas': 15,
    'Kaakkuri': 20,
    'Myllyoja': 20
  },
  'Kontinkangas': {
    'Keskusta (City Center)': 20,
    'Raksila': 15,
    'Tuira': 20,
    'Meri-Oulu': 30,
    'Pateniemi': 35,
    'Pohjois-Oulu': 15,
    'Kontinkangas': 0,
    'Kaakkuri': 10,
    'Myllyoja': 15
  },
  'Kaakkuri': {
    'Keskusta (City Center)': 15,
    'Raksila': 20,
    'Tuira': 25,
    'Meri-Oulu': 35,
    'Pateniemi': 40,
    'Pohjois-Oulu': 20,
    'Kontinkangas': 10,
    'Kaakkuri': 0,
    'Myllyoja': 20
  },
  'Myllyoja': {
    'Keskusta (City Center)': 10,
    'Raksila': 10,
    'Tuira': 20,
    'Meri-Oulu': 30,
    'Pateniemi': 35,
    'Pohjois-Oulu': 20,
    'Kontinkangas': 15,
    'Kaakkuri': 20,
    'Myllyoja': 0
  }
}

// Get care duration for patient
function getCareDuration(careNeeded) {
  return CARE_DURATION[careNeeded] || CARE_DURATION['default']
}

// Get travel time between two locations
function getTravelTime(from, to) {
  if (!from || !to) return 15 // default 15 min
  const routeMap = TRAVEL_TIME[from]
  return routeMap ? (routeMap[to] || 20) : 20
}

// Generate optimized route for patients on a given day
function optimizeRoute(patients) {
  if (patients.length === 0) return []

  // Group patients by location
  const byLocation = {}
  patients.forEach(p => {
    if (!byLocation[p.service_area]) {
      byLocation[p.service_area] = []
    }
    byLocation[p.service_area].push(p)
  })

  // Sort locations by proximity (simple nearest neighbor)
  const locations = Object.keys(byLocation)
  let optimizedRoute = []
  let currentLocation = 'Keskusta (City Center)' // Start from city center

  const visited = new Set()
  while (visited.size < locations.length) {
    let nearest = null
    let minTravel = Infinity

    for (const loc of locations) {
      if (!visited.has(loc)) {
        const travel = getTravelTime(currentLocation, loc)
        if (travel < minTravel) {
          minTravel = travel
          nearest = loc
        }
      }
    }

    if (nearest) {
      visited.add(nearest)
      optimizedRoute.push(...byLocation[nearest])
      currentLocation = nearest
    }
  }

  return optimizedRoute
}

// Calculate available time slots for professional on a specific day
export async function calculateAvailableTimeSlots(professionalId, visitDate) {
  try {
    const dateObj = new Date(visitDate)
    const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay()

    // Get professional's working hours for this day
    const { data: workingHours, error: whError } = await supabase
      .from('working_hours')
      .select('start_time, end_time')
      .eq('professional_id', professionalId)
      .eq('weekday', dayOfWeek)
      .single()

    if (whError || !workingHours) {
      return { available: false, reason: 'No working hours assigned for this day', patientCountOnDay: 0, maxCapacity: 4 }
    }

    // Get already assigned patients for this day - SEPARATE QUERY for safety
    const { data: assignedPatients, error: assignError } = await supabase
      .from('patient_assignments')
      .select('id, scheduled_visit_date, scheduled_visit_time')
      .eq('professional_id', professionalId)
      .eq('scheduled_visit_date', visitDate)
      .eq('status', 'active')

    if (assignError) {
      console.error(`Error fetching assignments for prof ${professionalId}:`, assignError)
      return { available: false, reason: 'Error checking capacity', patientCountOnDay: 0, maxCapacity: 4 }
    }

    // CAPACITY CHECK: Max 4 patients per day (8-hour shift)
    const currentPatientCountOnDay = assignedPatients ? assignedPatients.length : 0
    const MAX_PATIENTS_PER_DAY = 4

    console.log(`📊 Capacity check - Prof ${professionalId} on ${visitDate}: ${currentPatientCountOnDay}/${MAX_PATIENTS_PER_DAY} patients`)

    if (currentPatientCountOnDay >= MAX_PATIENTS_PER_DAY) {
      console.log(`❌ Day FULL: ${currentPatientCountOnDay}/${MAX_PATIENTS_PER_DAY}`)
      return {
        available: false,
        reason: `Professional already has ${currentPatientCountOnDay} patients scheduled on ${visitDate} (max ${MAX_PATIENTS_PER_DAY} per day)`,
        patientCountOnDay: currentPatientCountOnDay,
        maxCapacity: MAX_PATIENTS_PER_DAY
      }
    }

    // Parse working hours
    const [startHour, startMin] = workingHours.start_time.split(':').map(Number)
    const [endHour, endMin] = workingHours.end_time.split(':').map(Number)

    const dayStart = startHour * 60 + startMin // in minutes
    const dayEnd = endHour * 60 + endMin

    // Create occupied slots from assigned patients
    const occupiedSlots = []
    let currentLocation = 'Keskusta (City Center)'

    // Get full patient details for travel time calculation
    for (const assignment of assignedPatients || []) {
      const { data: patientData } = await supabase
        .from('patient_assignments')
        .select('patients(care_needed, service_area)')
        .eq('id', assignment.id)
        .single()

      if (patientData && patientData.patients) {
        const [visitHour, visitMin] = assignment.scheduled_visit_time.split(':').map(Number)
        const visitStart = visitHour * 60 + visitMin
        const careDuration = getCareDuration(patientData.patients.care_needed)
        const travelTime = getTravelTime(currentLocation, patientData.patients.service_area)

        occupiedSlots.push({
          start: Math.max(0, visitStart - travelTime),
          end: Math.min(dayEnd, visitStart + careDuration + travelTime)
        })

        currentLocation = patientData.patients.service_area
      }
    }

    // Generate available slots
    const availableSlots = []
    let currentTime = dayStart

    for (let slot of occupiedSlots.sort((a, b) => a.start - b.start)) {
      if (currentTime < slot.start) {
        availableSlots.push({
          start: currentTime,
          end: Math.min(slot.start, dayEnd),
          startTime: minutesToTime(currentTime),
          endTime: minutesToTime(Math.min(slot.start, dayEnd))
        })
      }
      currentTime = Math.max(currentTime, slot.end)
    }

    // Add remaining time
    if (currentTime < dayEnd) {
      availableSlots.push({
        start: currentTime,
        end: dayEnd,
        startTime: minutesToTime(currentTime),
        endTime: minutesToTime(dayEnd)
      })
    }

    return {
      available: availableSlots.length > 0,
      availableSlots,
      dayStart: minutesToTime(dayStart),
      dayEnd: minutesToTime(dayEnd),
      totalMinutesAvailable: availableSlots.reduce((sum, slot) => sum + (slot.end - slot.start), 0),
      patientCountOnDay: currentPatientCountOnDay,
      maxCapacity: MAX_PATIENTS_PER_DAY
    }
  } catch (err) {
    console.error('Error calculating available slots:', err)
    return { available: false, reason: 'Error calculating slots' }
  }
}

// Convert minutes to HH:MM format
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

// Find best fit for patient based on time slots
export async function findBestAssignmentWithTimeSlots(patientId) {
  try {
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (!patient) return { success: false, error: 'Patient not found' }

    // Get professionals serving this area with right skills
    const { data: professionals } = await supabase
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

    const candidates = []

    for (const prof of professionals) {
      // Check if at capacity
      if (prof.current_patient_count >= prof.max_patients) continue

      // Check skill match
      const { data: specializations } = await supabase
        .from('professional_specializations')
        .select('specialization')
        .eq('professional_id', prof.id)

      const skillMatch = specializations.some(s =>
        patient.care_needed.toLowerCase().includes(s.specialization.toLowerCase()) ||
        s.specialization.toLowerCase().includes(patient.care_needed.toLowerCase())
      )

      if (!skillMatch) continue

      // Check service area coverage
      const { data: serviceAreas } = await supabase
        .from('professional_service_areas')
        .select('service_area, is_primary')
        .eq('professional_id', prof.id)

      const servesArea = serviceAreas.some(a => a.service_area === patient.area)
      if (!servesArea) continue

      // Find available slots for next 7 days
      const slotInfo = {
        professional_id: prof.id,
        professional_name: prof.profiles.full_name,
        available_slots: []
      }

      for (let i = 0; i < 7; i++) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + i)
        const dateStr = futureDate.toISOString().split('T')[0]

        const slots = await calculateAvailableTimeSlots(prof.id, dateStr)
        if (slots.available) {
          const careDuration = getCareDuration(patient.care_needed)
          
          for (const slot of slots.availableSlots) {
            const slotDuration = slot.end - slot.start
            if (slotDuration >= careDuration + 15) { // 15 min buffer
              slotInfo.available_slots.push({
                date: dateStr,
                time: slot.startTime,
                duration_available: slot.end - slot.start
              })
            }
          }
        }
      }

      if (slotInfo.available_slots.length > 0) {
        candidates.push(slotInfo)
      }
    }

    return {
      success: true,
      candidates: candidates.slice(0, 5), // Top 5
      careDuration: getCareDuration(patient.care_needed)
    }
  } catch (err) {
    console.error('Error in findBestAssignmentWithTimeSlots:', err)
    return { success: false, error: err.message }
  }
}

// Helper: Check if a proposed time matches patient's visit time preferences
function matchesPatientTimePreference(proposedTime, patientPreferences) {
  if (!patientPreferences || !patientPreferences.preferred_visit_time) {
    return true // No preference = any time is good
  }

  const proposed = proposedTime // Format: "HH:MM"
  const preferred = patientPreferences.preferred_visit_time // Format: "HH:MM"
  const flexibility = patientPreferences.visit_time_flexibility || 'flexible_4hours'

  const propHours = parseInt(proposed.split(':')[0])
  const propMinutes = parseInt(proposed.split(':')[1])
  const prefHours = parseInt(preferred.split(':')[0])
  const prefMinutes = parseInt(preferred.split(':')[1])

  const propTotalMinutes = propHours * 60 + propMinutes
  const prefTotalMinutes = prefHours * 60 + prefMinutes
  const timeDiffMinutes = Math.abs(propTotalMinutes - prefTotalMinutes)

  switch (flexibility) {
    case 'fixed':
      // Must be within 30 minutes
      return timeDiffMinutes <= 30
    case 'flexible_2hours':
      // Must be within 2 hours
      return timeDiffMinutes <= 120
    case 'flexible_4hours':
      // Must be within 4 hours
      return timeDiffMinutes <= 240
    case 'flexible_all_day':
      // Any time in working hours
      return true
    default:
      return true
  }
}

// Smart schedule-aware assignment
export async function smartAssignPatient(patientId, professionalId, assignedById, existingAssignments = []) {
  try {
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (!patient) {
      return { success: false, error: 'Patient not found' }
    }

    console.log(`🏥 Assigning patient ${patientId}. Preferred time: ${patient.preferred_visit_time || 'None'} (${patient.visit_time_flexibility})`)

    // Find the soonest available slot in next 14 days
    const careDuration = getCareDuration(patient.care_needed)
    let bestSlot = null
    let slotsChecked = 0
    let daysSkipped = 0

    for (let i = 0; i < 14; i++) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + i)
      const dateStr = futureDate.toISOString().split('T')[0]

      // Count existing assignments on this date from BOTH database AND in-memory list
      const dbAssignments = await supabase
        .from('patient_assignments')
        .select('id')
        .eq('professional_id', professionalId)
        .eq('scheduled_visit_date', dateStr)
        .eq('status', 'active')

      const dbCount = dbAssignments.data ? dbAssignments.data.length : 0
      const memoryCount = existingAssignments.filter(a => a.scheduled_visit_date === dateStr).length
      const totalCount = dbCount + memoryCount
      const MAX_PATIENTS_PER_DAY = 4

      console.log(`📊 Day ${dateStr}: DB=${dbCount}, Memory=${memoryCount}, Total=${totalCount}/${MAX_PATIENTS_PER_DAY}`)

      // Check capacity including in-memory assignments
      if (totalCount >= MAX_PATIENTS_PER_DAY) {
        daysSkipped++
        console.log(`❌ Day ${dateStr} FULL (${totalCount}/${MAX_PATIENTS_PER_DAY}), skipping`)
        continue
      }

      const slots = await calculateAvailableTimeSlots(professionalId, dateStr)
      slotsChecked++

      // Find a suitable time slot on this day
      if (slots.available && slots.availableSlots && slots.availableSlots.length > 0) {
        // First pass: Look for slots matching patient preference
        for (const slot of slots.availableSlots) {
          const slotDuration = slot.end - slot.start
          // Ensure slot has enough time for care + buffer
          if (slotDuration >= careDuration + 15) {
            // Check if this time matches patient preference
            if (matchesPatientTimePreference(slot.startTime, patient)) {
              bestSlot = {
                date: dateStr,
                time: slot.startTime,
                patientCountOnDay: totalCount,
                matchesPreference: true
              }
              console.log(`✓ Found PREFERRED slot on ${dateStr} at ${slot.startTime} ✓`)
              break
            }
          }
        }
        
        // If no preferred slot found, take first available (if no strict preference)
        if (!bestSlot && patient.visit_time_flexibility !== 'fixed') {
          for (const slot of slots.availableSlots) {
            const slotDuration = slot.end - slot.start
            if (slotDuration >= careDuration + 15) {
              bestSlot = {
                date: dateStr,
                time: slot.startTime,
                patientCountOnDay: totalCount,
                matchesPreference: false
              }
              console.log(`✓ Found available slot on ${dateStr} at ${slot.startTime} (not ideal for preference, but available)`)
              break
            }
          }
        }
        
        if (bestSlot) break
      } else if (!slots.available && !slots.reason) {
        // No working hours on this day, continue
        console.log(`⏭️  Day ${dateStr}: No working hours, skipping`)
        continue
      }
    }

    if (!bestSlot) {
      return {
        success: false,
        error: 'No available time slots found for this professional in the next 14 days. Professional may be at capacity.'
      }
    }

    // Create assignment with calculated time slot
    const { data: assignment, error } = await supabase
      .from('patient_assignments')
      .insert([{
        patient_id: patientId,
        professional_id: professionalId,
        assigned_by_id: assignedById,
        assignment_date: new Date().toISOString(),
        scheduled_visit_date: bestSlot.date,
        scheduled_visit_time: bestSlot.time,
        service_area: patient.area,
        status: 'active',
        assignment_reason: `Smart scheduled - ${careDuration} min care + travel time`,
        match_score: 85
      }])
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    console.log(`✓ Patient ${patientId} assigned to professional ${professionalId} on ${bestSlot.date} at ${bestSlot.time}`)

    // Update professional's patient count
    await supabase.rpc('increment_patient_count', { prof_id: professionalId })

    return {
      success: true,
      assignment,
      scheduledDetails: {
        date: bestSlot.date,
        time: bestSlot.time,
        careDuration: careDuration,
        location: patient.area,
        patientCountOnDay: bestSlot.patientCountOnDay + 1 // Include the newly added patient
      }
    }
  } catch (err) {
    console.error('Error in smartAssignPatient:', err)
    return { success: false, error: err.message }
  }
}
