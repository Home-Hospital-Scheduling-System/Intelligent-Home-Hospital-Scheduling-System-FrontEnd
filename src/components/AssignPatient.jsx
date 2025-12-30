import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { suggestProfessionalsForPatient, createPatientAssignment } from '../lib/assignmentEngine'

export default function AssignPatient({ patientId, onAssigned, onClose }) {
  const [patient, setPatient] = useState(null)
  const [suggestedProfessionals, setSuggestedProfessionals] = useState([])
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    loadPatientAndSuggestions()
  }, [patientId])

  async function loadPatientAndSuggestions() {
    try {
      setLoading(true)
      setError('')

      // Load patient details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (patientError) throw patientError
      setPatient(patientData)

      // Get suggested professionals
      const suggestions = await suggestProfessionalsForPatient(patientData, 10)
      setSuggestedProfessionals(suggestions)
    } catch (err) {
      setError('Failed to load patient or professionals: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAssign() {
    if (!selectedProfessional) {
      setError('Please select a professional')
      return
    }

    try {
      setAssigning(true)
      setError('')

      const user = (await supabase.auth.getUser()).data.user
      await createPatientAssignment(patientId, selectedProfessional.id, user.id, reason)

      setSuccess(`Patient assigned to ${selectedProfessional.profiles.full_name}!`)
      setTimeout(() => {
        onAssigned?.()
        onClose?.()
      }, 1500)
    } catch (err) {
      setError('Failed to assign patient: ' + err.message)
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#0c4a6e' }}>
        Loading patient and professional suggestions...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      {/* Patient Info */}
      {patient && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #0ea5e9'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0c4a6e' }}>Patient: {patient.name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Area:</span> <strong>{patient.area}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Care Needed:</span> <strong>{patient.care_needed}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Phone:</span> <strong>{patient.phone}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Address:</span> <strong>{patient.address}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Professionals */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#0c4a6e', marginBottom: '1rem' }}>Suggested Professionals</h3>

        {suggestedProfessionals.length === 0 ? (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fbbf24',
            color: '#92400e'
          }}>
            No professionals available for this area and care type.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {suggestedProfessionals.map(prof => (
              <div
                key={prof.id}
                onClick={() => setSelectedProfessional(prof)}
                style={{
                  padding: '1rem',
                  backgroundColor: selectedProfessional?.id === prof.id ? '#dbeafe' : '#f8fafc',
                  border: selectedProfessional?.id === prof.id ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedProfessional?.id !== prof.id) {
                    e.currentTarget.style.backgroundColor = '#f1f5f9'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProfessional?.id !== prof.id) {
                    e.currentTarget.style.backgroundColor = '#f8fafc'
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#0c4a6e' }}>
                      👤 {prof.profiles?.full_name || 'Professional'}
                    </h4>
                    <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.85rem' }}>
                      📧 {prof.profiles?.email}
                    </p>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: prof.matchScore >= 80 ? '#dcfce7' : prof.matchScore >= 60 ? '#fef3c7' : '#fee2e2',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: prof.matchScore >= 80 ? '#166534' : prof.matchScore >= 60 ? '#92400e' : '#991b1b' }}>
                      {prof.matchScore}%
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Match</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Hours:</span>
                    <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500', color: '#0c4a6e' }}>
                      {prof.assigned_hours || 0}h / {prof.max_daily_hours || 8}h
                    </p>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Patients:</span>
                    <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500', color: '#0c4a6e' }}>
                      {prof.current_patient_count || 0} / {prof.max_patients || 20}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Reason */}
      {selectedProfessional && (
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Assignment Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Specialized in wound care, nearest to patient, best availability..."
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              minHeight: '80px',
              resize: 'vertical',
              color: '#0c4a6e'
            }}
          />
        </div>
      )}

      {/* Messages */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          borderRadius: '6px',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#dcfce7',
          borderRadius: '6px',
          border: '1px solid #86efac',
          color: '#166534',
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          ✓ {success}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
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
          onClick={handleAssign}
          disabled={!selectedProfessional || assigning}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: selectedProfessional && !assigning ? '#0ea5e9' : '#cbd5e1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedProfessional && !assigning ? 'pointer' : 'not-allowed',
            fontWeight: '500',
            fontSize: '0.95rem',
            opacity: assigning ? 0.7 : 1
          }}
        >
          {assigning ? 'Assigning...' : 'Assign Professional'}
        </button>
      </div>
    </div>
  )
}
