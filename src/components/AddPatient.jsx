import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNotification } from './Notification'
import { geocodeAddress } from '../lib/geoUtils'

// Password validation helper
function validatePassword(password) {
  const errors = []
  if (password.length < 6) errors.push('At least 6 characters')
  return errors
}

// Generate a random password
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

const CARE_OPTIONS = [
  'Wound Dressing',
  'Physical Therapy',
  'Medication Administration',
  'Nursing Care',
  'Occupational Therapy',
  'Home Health Aide',
  'Speech Therapy',
  'Respiratory Care',
  'Palliative Care',
  'Post-operative Care',
  'Chronic Disease Management',
  'Elderly Care',
  'Diabetic Care',
  'Cardiac Care',
  'Home Visit - General Checkup',
  'Home Visit - Blood Pressure Monitoring',
  'Home Visit - Wound Care',
  'Home Visit - Medication Management',
  'Home Visit - Post-Surgery Follow-up',
  'Hospital at Home - Acute Care',
  'Hospital at Home - Chronic Disease Management',
  'Hospital at Home - Rehabilitation',
  'Hospital at Home - Palliative Care',
  'Hospital at Home - Post-Hospitalization Recovery',
  'Other'
]

const AREA_OPTIONS = [
  'Keskusta (City Center)',
  'Karjaa',
  'Kaituri',
  'Kaakkuri',
  'Kaulakeidas',
  'Kipinä',
  'Kontinkangas',
  'Kontioniemi',
  'Koskenkorva',
  'Kuivasjärvi',
  'Kurila',
  'Kylmäkoski',
  'Löytönen',
  'Maakari',
  'Meri-Oulu',
  'Metso',
  'Myllyoja',
  'Nakkila',
  'Nokkakivi',
  'Oikari',
  'Oinava',
  'Pajuniemi',
  'Pateniemi',
  'Pikisaari',
  'Pohjois-Oulu',
  'Raksila',
  'Rajakari',
  'Ravantti',
  'Rikkavesi',
  'Rusko',
  'Saarinen',
  'Salmirinne',
  'Saloinen',
  'Sarakyla',
  'Satakari',
  'Semperi',
  'Sipilä',
  'Sulkava',
  'Suvela',
  'Tuira',
  'Tuorinoja',
  'Uimahalli',
  'Valiokylä',
  'Välikylä',
  'Vapaala',
  'Värttiö',
  'Ylikiiminki',
  'Zollitsch',
  'Other'
]

export default function AddPatient({ profileId, onPatientAdded, showFormByDefault = false }) {
  const notify = useNotification()
  const [showForm, setShowForm] = useState(showFormByDefault)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    createLogin: true, // Default to creating login
    address: '',
    area: '',
    care_needed: '',
    estimated_care_duration: '', // Custom duration in minutes
    preferred_visit_time: '',
    visit_time_flexibility: 'flexible',
    visit_notes: '',
    medical_notes: ''
  })

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setCreatedCredentials(null)
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.phone || !formData.address) {
        setError('Name, phone, and address are required.')
        setLoading(false)
        return
      }

      // If creating login, validate email and password
      if (formData.createLogin) {
        if (!formData.email) {
          setError('Email is required when creating patient login.')
          setLoading(false)
          return
        }
        if (!formData.password) {
          setError('Password is required when creating patient login.')
          setLoading(false)
          return
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.')
          setLoading(false)
          return
        }
        const passwordErrors = validatePassword(formData.password)
        if (passwordErrors.length > 0) {
          setError('Password requirements: ' + passwordErrors.join(', '))
          setLoading(false)
          return
        }
      }

      let patientProfileId = null

      // If creating login credentials
      if (formData.createLogin && formData.email && formData.password) {
        // Store current session before creating new user
        const { data: currentSession } = await supabase.auth.getSession()
        
        // Create auth user for patient using admin API or signUp
        // Note: Using signUp will create a new auth user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              role: 'patient'
            }
          }
        })

        if (signUpError) {
          console.error('Sign up error:', signUpError)
          setError('Failed to create patient account: ' + signUpError.message)
          setLoading(false)
          return
        }

        // Get the new user's ID
        const newUserId = signUpData.user?.id

        if (!newUserId) {
          setError('Failed to create patient account. Please try again.')
          setLoading(false)
          return
        }

        patientProfileId = newUserId

        // Restore the original session (professional's session)
        if (currentSession?.session) {
          await supabase.auth.setSession(currentSession.session)
        }

        // Create profile for the patient
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUserId,
            full_name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: 'patient'
          })

        if (profileError) {
          console.error('Profile insert error:', profileError)
          // Profile might already exist if email confirmation is disabled
          if (!profileError.message.includes('duplicate')) {
            setError('Failed to create patient profile: ' + profileError.message)
            setLoading(false)
            return
          }
        }

        // Store credentials to display to professional
        setCreatedCredentials({
          email: formData.email,
          password: formData.password
        })
      }

      // Insert patient into database
      const patientData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        area: formData.area,
        care_needed: formData.care_needed,
        estimated_care_duration: formData.estimated_care_duration ? parseInt(formData.estimated_care_duration) : null,
        preferred_visit_time: formData.preferred_visit_time || null,
        visit_time_flexibility: formData.visit_time_flexibility,
        visit_notes: formData.visit_notes || null,
        medical_notes: formData.medical_notes,
        profile_id: patientProfileId || profileId // Link to patient's own profile if created, otherwise use professional's
      }

      // Geocode the address to get GPS coordinates
      if (formData.address) {
        console.log('📍 Geocoding address:', formData.address)
        const coords = await geocodeAddress(formData.address)
        if (coords) {
          patientData.latitude = coords.lat
          patientData.longitude = coords.lng
          console.log(`✅ Geocoded to: (${coords.lat}, ${coords.lng})`)
        } else {
          console.log('⚠️ Could not geocode address, using zone-based location')
        }
      }

      const { data, error: insertError } = await supabase
        .from('patients')
        .insert([patientData])
        .select()

      if (insertError) {
        console.error('Insert error:', insertError)
        setError('Failed to add patient: ' + insertError.message)
      } else {
        if (formData.createLogin) {
          setSuccess('Patient added successfully with login credentials!')
        } else {
          setSuccess('Patient added successfully!')
        }
        
        // Reset form (keep credentials displayed)
        setFormData({
          name: '',
          phone: '',
          email: '',
          password: '',
          confirmPassword: '',
          createLogin: true,
          address: '',
          area: '',
          care_needed: '',
          estimated_care_duration: '',
          preferred_visit_time: '',
          visit_time_flexibility: 'flexible',
          visit_notes: '',
          medical_notes: ''
        })
        // Callback to refresh patient list
        if (onPatientAdded) onPatientAdded(data[0])
        
        // Only hide form if no credentials to display
        if (!formData.createLogin) {
          setTimeout(() => {
            setShowForm(false)
            setSuccess(null)
          }, 2000)
        }
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: showFormByDefault ? '0' : '2rem' }}>
      {!showFormByDefault && (
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          {showForm ? 'Cancel' : '+ Add New Patient'}
        </button>
      )}

      {showForm && (
        <div style={{
          marginTop: showFormByDefault ? '0' : '1.5rem',
          padding: showFormByDefault ? '0' : '2rem',
          backgroundColor: showFormByDefault ? 'transparent' : '#f8fafc',
          borderRadius: '8px',
          border: showFormByDefault ? 'none' : '1px solid #e2e8f0'
        }}>
          {!showFormByDefault && <h3 style={{ marginTop: 0, color: '#0c4a6e' }}>Add New Patient</h3>}
          
          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px',
              border: '1px solid #fca5a5'
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#dcfce7',
              color: '#166534',
              borderRadius: '6px',
              border: '1px solid #86efac'
            }}>
              {success}
            </div>
          )}

          {/* Display created credentials for professional to share with patient */}
          {createdCredentials && (
            <div style={{
              padding: '1.5rem',
              marginBottom: '1.5rem',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '2px solid #f59e0b'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔐 Patient Login Credentials Created
              </h4>
              <p style={{ margin: '0 0 0.75rem 0', color: '#78350f', fontSize: '0.9rem' }}>
                Please share these credentials with the patient. They can use them to log in and view their appointments.
              </p>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '1rem', 
                borderRadius: '6px',
                fontFamily: 'monospace'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Email:</strong> {createdCredentials.email}
                </div>
                <div>
                  <strong>Password:</strong> {createdCredentials.password}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`)
                  notify.success('Copied!', 'Credentials copied to clipboard')
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📋 Copy Credentials
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedCredentials(null)
                  setSuccess(null)
                }}
                style={{
                  marginTop: '1rem',
                  marginLeft: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ✓ Done
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Patient Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter patient's full name"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter phone number"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email {formData.createLogin ? '*' : ''}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required={formData.createLogin}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter email address"
              />
            </div>

            {/* Patient Login Credentials Section */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '1.5rem',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  id="createLogin"
                  name="createLogin"
                  checked={formData.createLogin}
                  onChange={(e) => setFormData(prev => ({ ...prev, createLogin: e.target.checked }))}
                  style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="createLogin" style={{ fontWeight: '600', color: '#1e40af', cursor: 'pointer' }}>
                  🔐 Create Login Credentials for Patient
                </label>
              </div>
              
              {formData.createLogin && (
                <>
                  <p style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: 0, marginBottom: '1rem' }}>
                    Create username and password so the patient can log in to view their appointments and schedule.
                  </p>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={formData.createLogin}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          paddingRight: '7rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                        placeholder="Enter password (min 6 characters)"
                      />
                      <div style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#e2e8f0',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newPassword = generatePassword()
                            setFormData(prev => ({ ...prev, password: newPassword, confirmPassword: newPassword }))
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                          title="Generate random password"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Confirm Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required={formData.createLogin}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword ? '#ef4444' : '#cbd5e1'}`,
                        borderRadius: '6px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Confirm password"
                    />
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Passwords do not match
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter patient's address"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Area
              </label>
              <select
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                  color: '#0c4a6e',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Select Service Area --</option>
                {AREA_OPTIONS.map(area => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Care Needed
              </label>
              <select
                name="care_needed"
                value={formData.care_needed}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
              >
                <option value="">-- Select Care Type --</option>
                {CARE_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                ⏱️ Estimated Visit Duration
              </label>
              <select
                name="estimated_care_duration"
                value={formData.estimated_care_duration}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
              >
                <option value="">-- Auto (based on care type) --</option>
                <option value="15">15 minutes - Quick check</option>
                <option value="30">30 minutes - Standard visit</option>
                <option value="45">45 minutes - Extended care</option>
                <option value="60">1 hour - Comprehensive care</option>
                <option value="90">1.5 hours - Complex procedures</option>
                <option value="120">2 hours - Full assessment</option>
              </select>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                How long each visit typically takes. Leave blank to use default based on care type.
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                ⏰ Preferred Visit Time
              </label>
              <input
                type="time"
                name="preferred_visit_time"
                value={formData.preferred_visit_time}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                Patient's preferred time for home visits (e.g., morning, afternoon)
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                🎯 Visit Time Flexibility
              </label>
              <select
                name="visit_time_flexibility"
                value={formData.visit_time_flexibility}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
              >
                <option value="strict">Strict - Must be exact time</option>
                <option value="flexible">Flexible - ±1 hour window acceptable</option>
                <option value="very_flexible">Very Flexible - ±2+ hours acceptable</option>
              </select>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                How flexible the patient is with visit timing
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                📋 Visit Notes
              </label>
              <textarea
                name="visit_notes"
                value={formData.visit_notes}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                placeholder="Any special notes about visit timing or scheduling preferences (e.g., busy on weekends, prefers mornings, etc.)"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Next Appointment Date
              </label>
              <input
                type="datetime-local"
                name="next_appointment_date"
                value={formData.next_appointment_date}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Medical Notes
              </label>
              <textarea
                name="medical_notes"
                value={formData.medical_notes}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  minHeight: '120px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                placeholder="Enter any relevant medical notes or special instructions"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: loading ? '#cbd5e1' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              {loading ? 'Adding Patient...' : 'Add Patient'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
