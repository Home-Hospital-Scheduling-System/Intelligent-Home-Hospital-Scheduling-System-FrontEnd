/**
 * Geo Location Utility for Home Hospital Scheduling
 * 
 * Provides:
 * - Geocoding addresses to lat/lng coordinates (using OpenStreetMap Nominatim)
 * - Distance calculation between coordinates (Haversine formula)
 * - Travel time estimation based on distance
 * - Route optimization for patient visits
 */

import { supabase } from './supabaseClient'

// Oulu, Finland bounding box for geocoding (to limit results to Oulu area)
const OULU_BOUNDS = {
  minLat: 64.85,
  maxLat: 65.15,
  minLng: 25.20,
  maxLng: 25.80
}

// Default coordinates for Oulu city center (fallback)
const OULU_CENTER = {
  lat: 65.0121,
  lng: 25.4651
}

// Average driving speed in km/h for travel time calculation
const AVERAGE_SPEED_KMH = 30 // Urban driving speed

// Minimum time between visits in minutes (for setup, documentation, etc.)
const MIN_BUFFER_MINUTES = 5

/**
 * Geocode an address to latitude/longitude using OpenStreetMap Nominatim API
 * @param {string} address - Full address string
 * @returns {Promise<{lat: number, lng: number, displayName: string} | null>}
 */
export async function geocodeAddress(address) {
  try {
    // Add Oulu, Finland to improve accuracy
    const searchAddress = address.includes('Oulu') ? address : `${address}, Oulu, Finland`
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&` +
      `q=${encodeURIComponent(searchAddress)}&` +
      `bounded=1&` +
      `viewbox=${OULU_BOUNDS.minLng},${OULU_BOUNDS.minLat},${OULU_BOUNDS.maxLng},${OULU_BOUNDS.maxLat}&` +
      `limit=1`,
      {
        headers: {
          'User-Agent': 'HomeHospitalSchedulingSystem/1.0'
        }
      }
    )

    if (!response.ok) {
      console.error('Geocoding API error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data && data.length > 0) {
      const result = data[0]
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)
      
      // Verify coordinates are within Oulu bounds
      if (lat >= OULU_BOUNDS.minLat && lat <= OULU_BOUNDS.maxLat &&
          lng >= OULU_BOUNDS.minLng && lng <= OULU_BOUNDS.maxLng) {
        console.log(`📍 Geocoded "${address}" → (${lat.toFixed(6)}, ${lng.toFixed(6)})`)
        return {
          lat,
          lng,
          displayName: result.display_name
        }
      }
    }

    console.warn(`⚠️ Could not geocode address: "${address}"`)
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c // Distance in km
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate estimated travel time between two points
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Estimated travel time in minutes
 */
export function calculateTravelTime(lat1, lng1, lat2, lng2) {
  const distanceKm = calculateDistance(lat1, lng1, lat2, lng2)
  
  // Time = Distance / Speed, converted to minutes
  // Add 1.3 multiplier for urban routing (not straight line)
  const travelMinutes = (distanceKm * 1.3 / AVERAGE_SPEED_KMH) * 60
  
  // Add buffer for parking, walking to door, etc.
  return Math.ceil(travelMinutes + MIN_BUFFER_MINUTES)
}

/**
 * Calculate travel time with fallback to zone-based estimate
 * @param {object} from - Origin location {lat, lng, area}
 * @param {object} to - Destination location {lat, lng, area}
 * @returns {number} Travel time in minutes
 */
export function getTravelTimeBetweenLocations(from, to) {
  // If both have coordinates, use real distance calculation
  if (from.lat && from.lng && to.lat && to.lng) {
    const time = calculateTravelTime(from.lat, from.lng, to.lat, to.lng)
    console.log(`🚗 Travel: (${from.lat.toFixed(4)}, ${from.lng.toFixed(4)}) → (${to.lat.toFixed(4)}, ${to.lng.toFixed(4)}) = ${time} min`)
    return time
  }
  
  // Fallback to zone-based estimate if no coordinates
  return getZoneBasedTravelTime(from.area, to.area)
}

/**
 * Legacy zone-based travel time (fallback)
 */
const ZONE_TRAVEL_TIME = {
  'Keskusta (City Center)': { 'Keskusta (City Center)': 5, 'Raksila': 10, 'Tuira': 12, 'Meri-Oulu': 15, 'Pateniemi': 20, 'Pohjois-Oulu': 15, 'Kontinkangas': 12, 'Kaakkuri': 10, 'Myllyoja': 8 },
  'Raksila': { 'Keskusta (City Center)': 10, 'Raksila': 5, 'Tuira': 8, 'Meri-Oulu': 12, 'Pateniemi': 18, 'Pohjois-Oulu': 12, 'Kontinkangas': 10, 'Kaakkuri': 12, 'Myllyoja': 8 },
  'Tuira': { 'Keskusta (City Center)': 12, 'Raksila': 8, 'Tuira': 5, 'Meri-Oulu': 10, 'Pateniemi': 15, 'Pohjois-Oulu': 10, 'Kontinkangas': 12, 'Kaakkuri': 15, 'Myllyoja': 12 },
  'Meri-Oulu': { 'Keskusta (City Center)': 15, 'Raksila': 12, 'Tuira': 10, 'Meri-Oulu': 5, 'Pateniemi': 8, 'Pohjois-Oulu': 12, 'Kontinkangas': 18, 'Kaakkuri': 20, 'Myllyoja': 18 },
  'Pateniemi': { 'Keskusta (City Center)': 20, 'Raksila': 18, 'Tuira': 15, 'Meri-Oulu': 8, 'Pateniemi': 5, 'Pohjois-Oulu': 15, 'Kontinkangas': 22, 'Kaakkuri': 25, 'Myllyoja': 22 },
  'Pohjois-Oulu': { 'Keskusta (City Center)': 15, 'Raksila': 12, 'Tuira': 10, 'Meri-Oulu': 12, 'Pateniemi': 15, 'Pohjois-Oulu': 5, 'Kontinkangas': 10, 'Kaakkuri': 12, 'Myllyoja': 12 },
  'Kontinkangas': { 'Keskusta (City Center)': 12, 'Raksila': 10, 'Tuira': 12, 'Meri-Oulu': 18, 'Pateniemi': 22, 'Pohjois-Oulu': 10, 'Kontinkangas': 5, 'Kaakkuri': 8, 'Myllyoja': 10 },
  'Kaakkuri': { 'Keskusta (City Center)': 10, 'Raksila': 12, 'Tuira': 15, 'Meri-Oulu': 20, 'Pateniemi': 25, 'Pohjois-Oulu': 12, 'Kontinkangas': 8, 'Kaakkuri': 5, 'Myllyoja': 12 },
  'Myllyoja': { 'Keskusta (City Center)': 8, 'Raksila': 8, 'Tuira': 12, 'Meri-Oulu': 18, 'Pateniemi': 22, 'Pohjois-Oulu': 12, 'Kontinkangas': 10, 'Kaakkuri': 12, 'Myllyoja': 5 }
}

function getZoneBasedTravelTime(fromArea, toArea) {
  if (!fromArea || !toArea) return 15 // Default
  const fromZone = ZONE_TRAVEL_TIME[fromArea]
  return fromZone ? (fromZone[toArea] || 15) : 15
}

/**
 * Optimize route using nearest-neighbor algorithm
 * Orders patients by distance from current location
 * @param {Array} patients - Array of patients with {id, lat, lng, area, care_needed}
 * @param {object} startLocation - Starting point {lat, lng}
 * @returns {Array} Optimized order of patients
 */
export function optimizeRouteByDistance(patients, startLocation) {
  if (!patients || patients.length === 0) return []
  if (patients.length === 1) return patients
  
  const optimized = []
  const remaining = [...patients]
  let currentLocation = startLocation || OULU_CENTER
  
  console.log(`🗺️ Optimizing route for ${patients.length} patients starting from (${currentLocation.lat?.toFixed(4)}, ${currentLocation.lng?.toFixed(4)})`)
  
  while (remaining.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Infinity
    
    for (let i = 0; i < remaining.length; i++) {
      const patient = remaining[i]
      let distance
      
      if (patient.latitude && patient.longitude && currentLocation.lat && currentLocation.lng) {
        distance = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          patient.latitude, patient.longitude
        )
      } else {
        // Fallback to zone-based estimate (convert minutes to pseudo-distance)
        distance = getZoneBasedTravelTime(currentLocation.area, patient.area) / 2
      }
      
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }
    
    const nearest = remaining.splice(nearestIndex, 1)[0]
    optimized.push(nearest)
    
    // Update current location
    currentLocation = {
      lat: nearest.latitude,
      lng: nearest.longitude,
      area: nearest.area
    }
    
    console.log(`  → Next: Patient ${nearest.id} (${nearest.area}) - ${nearestDistance.toFixed(2)} km away`)
  }
  
  return optimized
}

/**
 * Calculate total route distance and time
 * @param {Array} patients - Ordered array of patients
 * @param {object} startLocation - Starting point {lat, lng}
 * @returns {object} {totalDistanceKm, totalTimeMinutes, segments}
 */
export function calculateRouteMetrics(patients, startLocation) {
  if (!patients || patients.length === 0) {
    return { totalDistanceKm: 0, totalTimeMinutes: 0, segments: [] }
  }
  
  let totalDistance = 0
  let totalTime = 0
  const segments = []
  let currentLocation = startLocation || OULU_CENTER
  
  for (const patient of patients) {
    const from = { lat: currentLocation.lat, lng: currentLocation.lng, area: currentLocation.area }
    const to = { lat: patient.latitude, lng: patient.longitude, area: patient.area }
    
    let segmentDistance = 0
    let segmentTime = 0
    
    if (from.lat && from.lng && to.lat && to.lng) {
      segmentDistance = calculateDistance(from.lat, from.lng, to.lat, to.lng)
      segmentTime = calculateTravelTime(from.lat, from.lng, to.lat, to.lng)
    } else {
      segmentTime = getZoneBasedTravelTime(from.area, to.area)
      segmentDistance = segmentTime * 0.5 // Rough estimate
    }
    
    segments.push({
      from: from.area || 'Start',
      to: to.area || patient.name,
      distanceKm: segmentDistance,
      timeMinutes: segmentTime
    })
    
    totalDistance += segmentDistance
    totalTime += segmentTime
    
    currentLocation = to
  }
  
  return {
    totalDistanceKm: Math.round(totalDistance * 10) / 10,
    totalTimeMinutes: Math.ceil(totalTime),
    segments
  }
}

/**
 * Geocode a patient's address and update the database
 * @param {string} patientId - Patient ID
 * @param {string} address - Address to geocode
 * @returns {Promise<boolean>} Success status
 */
export async function geocodeAndUpdatePatient(patientId, address) {
  try {
    const coords = await geocodeAddress(address)
    
    if (coords) {
      const { error } = await supabase
        .from('patients')
        .update({
          latitude: coords.lat,
          longitude: coords.lng
        })
        .eq('id', patientId)
      
      if (error) {
        console.error('Error updating patient coordinates:', error)
        return false
      }
      
      console.log(`✅ Updated patient ${patientId} with coordinates`)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error in geocodeAndUpdatePatient:', error)
    return false
  }
}

/**
 * Batch geocode all patients without coordinates
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function batchGeocodePatients() {
  try {
    // Get patients without coordinates
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, address')
      .or('latitude.is.null,longitude.is.null')
    
    if (error) {
      console.error('Error fetching patients:', error)
      return { success: 0, failed: 0 }
    }
    
    console.log(`📍 Geocoding ${patients.length} patients...`)
    
    let success = 0
    let failed = 0
    
    for (const patient of patients) {
      if (patient.address) {
        // Rate limit: Nominatim allows 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1100))
        
        const result = await geocodeAndUpdatePatient(patient.id, patient.address)
        if (result) {
          success++
        } else {
          failed++
        }
      } else {
        failed++
      }
    }
    
    console.log(`✅ Geocoding complete: ${success} success, ${failed} failed`)
    return { success, failed }
  } catch (error) {
    console.error('Error in batchGeocodePatients:', error)
    return { success: 0, failed: 0 }
  }
}

/**
 * Get distance and travel time between two patients
 */
export function getDistanceBetweenPatients(patient1, patient2) {
  if (patient1.latitude && patient1.longitude && patient2.latitude && patient2.longitude) {
    const distance = calculateDistance(
      patient1.latitude, patient1.longitude,
      patient2.latitude, patient2.longitude
    )
    const travelTime = calculateTravelTime(
      patient1.latitude, patient1.longitude,
      patient2.latitude, patient2.longitude
    )
    return { distanceKm: Math.round(distance * 10) / 10, travelMinutes: travelTime }
  }
  
  // Fallback
  const travelTime = getZoneBasedTravelTime(patient1.area, patient2.area)
  return { distanceKm: travelTime * 0.5, travelMinutes: travelTime }
}
