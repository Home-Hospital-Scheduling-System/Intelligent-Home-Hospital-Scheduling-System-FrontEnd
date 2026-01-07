import { supabase } from './supabaseClient'

// Base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

/**
 * Get the current Supabase access token
 */
async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token || null
  } catch (err) {
    console.error('Error getting access token:', err)
    return null
  }
}

/**
 * Make a request to the backend API with automatic token injection
 */
async function apiCall(endpoint, options = {}) {
  const token = await getAccessToken()
  
  if (!token) {
    throw new Error('No authentication token available')
  }

  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (err) {
    console.error(`API call failed: ${endpoint}`, err)
    throw err
  }
}

/**
 * GET request
 */
export async function apiGet(endpoint) {
  return apiCall(endpoint, {
    method: 'GET'
  })
}

/**
 * POST request
 */
export async function apiPost(endpoint, data) {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * PUT request
 */
export async function apiPut(endpoint, data) {
  return apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * DELETE request
 */
export async function apiDelete(endpoint) {
  return apiCall(endpoint, {
    method: 'DELETE'
  })
}

/**
 * PATCH request
 */
export async function apiPatch(endpoint, data) {
  return apiCall(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export { API_BASE_URL }
