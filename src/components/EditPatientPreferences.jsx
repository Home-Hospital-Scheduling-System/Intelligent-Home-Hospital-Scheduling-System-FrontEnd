import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function EditPatientPreferences({ patient, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    preferred_visit_time: patient.preferred_visit_time || '09:00',
    visit_time_flexibility: patient.visit_time_flexibility || 'flexible_4hours',
    visit_notes: patient.visit_notes || ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          preferred_visit_time: formData.preferred_visit_time,
          visit_time_flexibility: formData.visit_time_flexibility,
          visit_notes: formData.visit_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id)

      if (updateError) throw updateError

      setSuccess('✓ Patient visit preferences updated!')
      setTimeout(() => {
        if (onUpdated) onUpdated()
        onClose()
      }, 800)
    } catch (err) {
      setError('Error updating preferences: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      padding: 20,
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
      border: '1px solid #ddd',
      maxWidth: 500
    }}>
      <h3>Visit Time Preferences - {patient.name}</h3>

      <form onSubmit={handleSubmit}>
        {/* Preferred Visit Time */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>
            Preferred Visit Time:
          </label>
          <input
            type="time"
            name="preferred_visit_time"
            value={formData.preferred_visit_time}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 4,
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#666' }}>What time does patient prefer care visits?</small>
        </div>

        {/* Visit Time Flexibility */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>
            Visit Time Flexibility:
          </label>
          <select
            name="visit_time_flexibility"
            value={formData.visit_time_flexibility}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 4,
              boxSizing: 'border-box'
            }}
          >
            <option value="fixed">
              Fixed - Must be at exact time (e.g., medication at 2 PM)
            </option>
            <option value="flexible_2hours">
              Flexible ±2 hours - Within 2 hours of preferred time
            </option>
            <option value="flexible_4hours">
              Flexible ±4 hours - Within 4 hours of preferred time
            </option>
            <option value="flexible_all_day">
              Flexible - Any time in working hours
            </option>
          </select>
          <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
            How flexible is the patient's schedule?
          </small>
        </div>

        {/* Visit Notes */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>
            Special Notes:
          </label>
          <textarea
            name="visit_notes"
            value={formData.visit_notes}
            onChange={handleInputChange}
            placeholder="e.g., 'Patient sleeps until 10 AM', 'Prefers morning visits', 'Has meditation at 3 PM daily'"
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 4,
              minHeight: 80,
              boxSizing: 'border-box',
              fontFamily: 'Arial'
            }}
          />
        </div>

        {/* Messages */}
        {error && <p style={{ color: 'red', marginBottom: 10 }}>{error}</p>}
        {success && <p style={{ color: 'green', marginBottom: 10 }}>{success}</p>}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : '✓ Save Preferences'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: 10,
              backgroundColor: '#999',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div style={{
        marginTop: 15,
        padding: 10,
        backgroundColor: '#e3f2fd',
        borderLeft: '3px solid #2196F3',
        borderRadius: 4
      }}>
        <strong>ℹ️ How This Works:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: 20 }}>
          <li>The AI will try to schedule visits at the patient's preferred time</li>
          <li>"Fixed" means strict adherence to medication/therapy schedules</li>
          <li>Special notes help coordinators remember important details</li>
          <li>These preferences improve assignment quality and patient satisfaction</li>
        </ul>
      </div>
    </div>
  )
}
