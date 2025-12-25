import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AddPatient from './AddPatient'

export default function ProfessionalView({ profile }) {
  const [professionalData, setProfessionalData] = useState(null)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfessionalData()
  }, [profile])

  async function fetchProfessionalData() {
    try {
      setLoading(true)
      
      // Fetch professional details
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('profile_id', profile.id)
        .single()

      if (error) {
        console.error('Error fetching professional data:', error)
      } else {
        setProfessionalData(data)
        // Fetch patients associated with this professional
        fetchPatients(data.id)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPatients(professionalId) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching patients:', error)
      } else {
        setPatients(data || [])
      }
    } catch (err) {
      console.error('Unexpected error fetching patients:', err)
    }
  }

  function handlePatientAdded(newPatient) {
    setPatients(prev => [newPatient, ...prev])
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Professional Dashboard</h1>
      
      <div style={{ 
        background: '#f0f9ff', 
        padding: '1.5rem', 
        borderRadius: '8px',
        marginTop: '1.5rem',
        border: '1px solid #0ea5e9'
      }}>
        <h2 style={{ marginTop: 0, color: '#0c4a6e' }}>Your Profile</h2>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>Name:</strong> {profile.full_name}
        </div>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <strong>Email:</strong> {profile.email}
        </div>
        
        {profile.phone && (
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Phone:</strong> {profile.phone}
          </div>
        )}
        
        {professionalData && (
          <>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Type:</strong> {professionalData.kind.charAt(0).toUpperCase() + professionalData.kind.slice(1)}
            </div>
            
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Specialty:</strong> {professionalData.specialty}
            </div>
            
            {professionalData.license_number && (
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>License Number:</strong> {professionalData.license_number}
              </div>
            )}
          </>
        )}
      </div>

      {/* Patient Management Section */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ color: '#0c4a6e' }}>Patient Management</h2>
        
        {profile && (
          <AddPatient 
            profileId={profile.id}
            onPatientAdded={handlePatientAdded}
          />
        )}

        {/* Patients List */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ color: '#0c4a6e' }}>
            Patients ({patients.length})
          </h3>
          
          {patients.length === 0 ? (
            <div style={{
              padding: '2rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #0ea5e9',
              color: '#0c4a6e',
              textAlign: 'center'
            }}>
              <p>No patients added yet. Start by adding your first patient.</p>
            </div>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              {patients.map(patient => (
                <div
                  key={patient.id}
                  style={{
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>
                      {patient.name}
                    </h4>
                    {patient.phone && (
                      <p style={{ margin: '0.25rem 0', color: '#475569' }}>
                        <strong>Phone:</strong> {patient.phone}
                      </p>
                    )}
                    {patient.email && (
                      <p style={{ margin: '0.25rem 0', color: '#475569' }}>
                        <strong>Email:</strong> {patient.email}
                      </p>
                    )}
                    {patient.address && (
                      <p style={{ margin: '0.25rem 0', color: '#475569' }}>
                        <strong>Address:</strong> {patient.address}
                      </p>
                    )}
                    {patient.area && (
                      <p style={{ margin: '0.25rem 0', color: '#475569' }}>
                        <strong>Area:</strong> {patient.area}
                      </p>
                    )}
                    {patient.care_needed && (
                      <p style={{ margin: '0.25rem 0', color: '#475569' }}>
                        <strong>Care Needed:</strong> {patient.care_needed}
                      </p>
                    )}
                    {patient.next_appointment_date && (
                      <p style={{ margin: '0.25rem 0', color: '#475569' }}>
                        <strong>Next Appointment:</strong> {new Date(patient.next_appointment_date).toLocaleDateString()} {new Date(patient.next_appointment_date).toLocaleTimeString()}
                      </p>
                    )}
                    {patient.medical_notes && (
                      <p style={{ margin: '0.25rem 0', color: '#475569', fontStyle: 'italic' }}>
                        <strong>Notes:</strong> {patient.medical_notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
