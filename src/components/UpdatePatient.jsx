import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function UpdatePatient({ patient, onPatientUpdated, onClose }) {
  const [formData, setFormData] = useState({
    status: 'active',
    sessions_completed: 0,
    next_appointment_date: '',
    treatment_notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Load current patient data
    if (patient) {
      setFormData({
        status: patient.status || 'active',
        sessions_completed: patient.sessions_completed || 0,
        next_appointment_date: patient.next_appointment_date ? patient.next_appointment_date.split('T')[0] : '',
        treatment_notes: patient.treatment_notes || ''
      })
    }
  }, [patient])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sessions_completed' ? parseInt(value) || 0 : value
    }))
  }

  const handleIncrementSessions = () => {
    setFormData(prev => ({
      ...prev,
      sessions_completed: prev.sessions_completed + 1
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Update patient in database
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          status: formData.status,
          sessions_completed: formData.sessions_completed,
          next_appointment_date: formData.next_appointment_date || null,
          treatment_notes: formData.treatment_notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id)

      if (updateError) {
        setError('Failed to update patient: ' + updateError.message)
      } else {
        setSuccess('Patient updated successfully!')
        // Call callback to refresh patient data
        if (onPatientUpdated) {
          onPatientUpdated()
        }
        // Auto-close after 1.5 seconds
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (err) {
      setError('Unexpected error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Status */}
      <div>
        <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          📊 Patient Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '0.95rem',
            boxSizing: 'border-box',
            color: '#0c4a6e'
          }}
        >
          <option value="active">Active (Ongoing)</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Sessions Completed */}
      <div>
        <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          🏥 Sessions Completed
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="number"
            name="sessions_completed"
            value={formData.sessions_completed}
            onChange={handleChange}
            min="0"
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
              color: '#0c4a6e'
            }}
          />
          <button
            type="button"
            onClick={handleIncrementSessions}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}
            title="Increment session count by 1"
          >
            +1 Session
          </button>
        </div>
      </div>

      {/* Next Appointment Date */}
      <div>
        <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          📅 Next Appointment Date
        </label>
        <input
          type="date"
          name="next_appointment_date"
          value={formData.next_appointment_date}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '0.95rem',
            boxSizing: 'border-box',
            color: '#0c4a6e'
          }}
        />
      </div>

      {/* Treatment Notes */}
      <div>
        <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          📝 Treatment Notes (Add or Update)
        </label>
        <textarea
          name="treatment_notes"
          value={formData.treatment_notes}
          onChange={handleChange}
          placeholder="Add treatment details, observations, or progress notes from this session..."
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '0.95rem',
            boxSizing: 'border-box',
            color: '#0c4a6e',
            fontFamily: 'inherit',
            minHeight: '120px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          borderRadius: '6px',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#dcfce7',
          borderRadius: '6px',
          border: '1px solid #86efac',
          color: '#166534',
          fontSize: '0.9rem'
        }}>
          ✓ {success}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f1f5f9',
            color: '#0c4a6e',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading ? '#cbd5e1' : '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '0.95rem',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Updating...' : 'Update Patient'}
        </button>
      </div>
    </form>
  )
}
