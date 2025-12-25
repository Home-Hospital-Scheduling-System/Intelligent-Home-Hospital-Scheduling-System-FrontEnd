import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

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
  'Other'
]

export default function AddPatient({ profileId, onPatientAdded }) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    area: '',
    care_needed: '',
    next_appointment_date: '',
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
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.phone || !formData.address) {
        setError('Name, phone, and address are required.')
        setLoading(false)
        return
      }

      // Insert patient into database
      const { data, error: insertError } = await supabase
        .from('patients')
        .insert([
          {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            area: formData.area,
            care_needed: formData.care_needed,
            next_appointment_date: formData.next_appointment_date || null,
            medical_notes: formData.medical_notes,
            profile_id: profileId
          }
        ])
        .select()

      if (insertError) {
        console.error('Insert error:', insertError)
        setError('Failed to add patient: ' + insertError.message)
      } else {
        setSuccess('Patient added successfully!')
        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          address: '',
          area: '',
          care_needed: '',
          next_appointment_date: '',
          medical_notes: ''
        })
        // Callback to refresh patient list
        if (onPatientAdded) onPatientAdded(data[0])
        // Hide form after success
        setTimeout(() => {
          setShowForm(false)
          setSuccess(null)
        }, 2000)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: '2rem' }}>
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

      {showForm && (
        <div style={{
          marginTop: '1.5rem',
          padding: '2rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ marginTop: 0, color: '#0c4a6e' }}>Add New Patient</h3>
          
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
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
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
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter service area"
              />
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
