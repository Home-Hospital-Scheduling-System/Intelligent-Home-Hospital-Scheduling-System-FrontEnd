import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AddPatient from './AddPatient'
import UpdatePatient from './UpdatePatient'

export default function ProfessionalView({ profile }) {
  const [professionalData, setProfessionalData] = useState(null)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [modalTab, setModalTab] = useState('profile') // 'profile', 'addPatient', or 'patients'
  const [patientFilter, setPatientFilter] = useState('') // filter search term
  const [selectedPatient, setSelectedPatient] = useState(null) // selected patient for full view
  const [showUpdateForm, setShowUpdateForm] = useState(false) // show update form

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
    fetchPatients(professionalData?.id)
  }

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(patientFilter.toLowerCase()) ||
    patient.phone?.includes(patientFilter) ||
    patient.address?.toLowerCase().includes(patientFilter.toLowerCase()) ||
    patient.area?.toLowerCase().includes(patientFilter.toLowerCase()) ||
    patient.care_needed?.toLowerCase().includes(patientFilter.toLowerCase())
  )

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem 2rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#0c4a6e' }}>
          Hi, {profile.full_name.split(' ')[0]}! 👋
        </h1>
        
        <button
          onClick={() => setShowProfileModal(true)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#0ea5e9',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}
          title="View Profile"
        >
          👤
        </button>
      </div>

      <>
        {/* Profile Modal */}
        {showProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#0c4a6e' }}>
                {modalTab === 'profile' && 'Your Profile'}
                {modalTab === 'addPatient' && 'Add Patient'}
                {modalTab === 'patients' && 'Your Patients'}
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              borderBottom: '2px solid #e2e8f0',
              overflowX: 'auto'
            }}>
              <button
                onClick={() => setModalTab('profile')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: modalTab === 'profile' ? '#0ea5e9' : 'transparent',
                  color: modalTab === 'profile' ? 'white' : '#475569',
                  border: 'none',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                👤 Profile
              </button>
              <button
                onClick={() => setModalTab('patients')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: modalTab === 'patients' ? '#0ea5e9' : 'transparent',
                  color: modalTab === 'patients' ? 'white' : '#475569',
                  border: 'none',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                👥 Patients ({patients.length})
              </button>
              <button
                onClick={() => setModalTab('addPatient')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: modalTab === 'addPatient' ? '#0ea5e9' : 'transparent',
                  color: modalTab === 'addPatient' ? 'white' : '#475569',
                  border: 'none',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                ➕ Add Patient
              </button>
            </div>

            {/* Profile Tab Content */}
            {modalTab === 'profile' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#475569' }}>Name:</strong>
                  <p style={{ margin: '0.25rem 0 0.75rem 0', color: '#0c4a6e' }}>{profile.full_name}</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#475569' }}>Email:</strong>
                  <p style={{ margin: '0.25rem 0 0.75rem 0', color: '#0c4a6e' }}>{profile.email}</p>
                </div>

                {profile.phone && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#475569' }}>Phone:</strong>
                    <p style={{ margin: '0.25rem 0 0.75rem 0', color: '#0c4a6e' }}>{profile.phone}</p>
                  </div>
                )}

                {professionalData && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#475569' }}>Type:</strong>
                      <p style={{ margin: '0.25rem 0 0.75rem 0', color: '#0c4a6e' }}>
                        {professionalData.kind.charAt(0).toUpperCase() + professionalData.kind.slice(1)}
                      </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#475569' }}>Specialty:</strong>
                      <p style={{ margin: '0.25rem 0 0.75rem 0', color: '#0c4a6e' }}>{professionalData.specialty}</p>
                    </div>

                    {professionalData.license_number && (
                      <div style={{ marginBottom: '1rem' }}>
                        <strong style={{ color: '#475569' }}>License Number:</strong>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#0c4a6e' }}>{professionalData.license_number}</p>
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={() => setShowProfileModal(false)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    marginTop: '1.5rem',
                    backgroundColor: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Close
                </button>
              </div>
            )}

            {/* Add Patient Tab Content */}
            {modalTab === 'addPatient' && (
              <div>
                {profile && (
                  <AddPatient 
                    profileId={profile.id}
                    onPatientAdded={() => {
                      handlePatientAdded()
                      setModalTab('patients')
                    }}
                  />
                )}
              </div>
            )}

            {/* Your Patients Tab Content */}
            {modalTab === 'patients' && (
              <div>
                {/* Search Filter */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search patients by name, phone, area..."
                    value={patientFilter}
                    onChange={(e) => setPatientFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  {patientFilter && (
                    <button
                      onClick={() => setPatientFilter('')}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>

                {patients.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #0ea5e9',
                    color: '#0c4a6e',
                    textAlign: 'center'
                  }}>
                    <p>No patients added yet. Click the "Add Patient" tab to add your first patient.</p>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    border: '1px solid #fbbf24',
                    color: '#92400e',
                    textAlign: 'center'
                  }}>
                    <p>No patients match "{patientFilter}". Try a different search.</p>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    maxHeight: '50vh',
                    overflowY: 'auto'
                  }}>
                    {filteredPatients.map(patient => (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        style={{
                          padding: '1rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          ':hover': { backgroundColor: '#e0f2fe' }
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      >
                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#0c4a6e', fontSize: '1rem' }}>
                          {patient.name}
                        </h4>
                        
                        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                          {patient.phone && (
                            <div>
                              <span style={{ color: '#64748b' }}>📞</span> {patient.phone}
                            </div>
                          )}
                          {patient.address && (
                            <div>
                              <span style={{ color: '#64748b' }}>📍</span> {patient.address}
                            </div>
                          )}
                          {patient.area && (
                            <div>
                              <span style={{ color: '#64748b' }}>📌</span> {patient.area}
                            </div>
                          )}
                          {patient.care_needed && (
                            <div>
                              <span style={{ color: '#64748b' }}>🏥</span> {patient.care_needed}
                            </div>
                          )}
                          {patient.next_appointment_date && (
                            <div>
                              <span style={{ color: '#64748b' }}>📅</span> {new Date(patient.next_appointment_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-Screen Patient Detail Modal */}
      {selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '2rem',
              borderBottom: '1px solid #e2e8f0',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white'
            }}>
              <h2 style={{ margin: 0, color: '#0c4a6e', fontSize: '1.5rem' }}>
                {showUpdateForm ? 'Update Patient' : 'Patient Details'}
              </h2>
              <button
                onClick={() => {
                  if (showUpdateForm) {
                    setShowUpdateForm(false)
                  } else {
                    setSelectedPatient(null)
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem' }}>
              {showUpdateForm ? (
                <UpdatePatient 
                  patient={selectedPatient} 
                  onPatientUpdated={() => {
                    // Refresh patient data after update
                    fetchPatients(professionalData.id)
                    setShowUpdateForm(false)
                  }}
                  onClose={() => setShowUpdateForm(false)}
                />
              ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      👤 Full Name
                    </label>
                    <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1.1rem', fontWeight: '500' }}>
                      {selectedPatient.name}
                    </p>
                  </div>

                  {/* Phone */}
                  {selectedPatient.phone && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        📞 Phone
                      </label>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1rem' }}>
                        {selectedPatient.phone}
                      </p>
                    </div>
                  )}

                  {/* Email */}
                  {selectedPatient.email && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        📧 Email
                      </label>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1rem' }}>
                        {selectedPatient.email}
                      </p>
                    </div>
                  )}

                  {/* Address */}
                  {selectedPatient.address && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        📍 Address
                      </label>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1rem' }}>
                        {selectedPatient.address}
                      </p>
                    </div>
                  )}

                  {/* Area */}
                  {selectedPatient.area && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        📌 Area
                      </label>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1rem' }}>
                        {selectedPatient.area}
                      </p>
                    </div>
                  )}

                  {/* Care Needed */}
                  {selectedPatient.care_needed && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        🏥 Care Needed
                      </label>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1rem' }}>
                        {selectedPatient.care_needed}
                      </p>
                    </div>
                  )}

                  {/* Status */}
                  {selectedPatient.status && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        📊 Status
                      </label>
                      <p style={{ 
                        margin: 0, 
                        color: '#0c4a6e', 
                        fontSize: '1rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: selectedPatient.status === 'active' ? '#dcfce7' : selectedPatient.status === 'completed' ? '#dbeafe' : '#fef3c7',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {selectedPatient.status.charAt(0).toUpperCase() + selectedPatient.status.slice(1)}
                      </p>
                    </div>
                  )}

                  {/* Sessions Completed */}
                  {selectedPatient.sessions_completed !== undefined && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        🏥 Sessions Completed
                      </label>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1rem', fontWeight: '500' }}>
                        {selectedPatient.sessions_completed} session(s)
                      </p>
                    </div>
                  )}

                  {/* Next Appointment */}
                  {selectedPatient.next_appointment_date && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        📅 Next Appointment
                      </label>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1rem' }}>
                        {new Date(selectedPatient.next_appointment_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Medical Notes */}
                  {selectedPatient.medical_notes && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        📝 Medical Notes
                      </label>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {selectedPatient.medical_notes}
                      </p>
                    </div>
                  )}

                  {/* Treatment Notes */}
                  {selectedPatient.treatment_notes && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        📋 Treatment Notes
                      </label>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.95rem', lineHeight: '1.5', backgroundColor: '#f0f9ff', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #0ea5e9' }}>
                        {selectedPatient.treatment_notes}
                      </p>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              {!showUpdateForm && (
                <button
                  onClick={() => setShowUpdateForm(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981'
                  }}
                >
                  ✏️ Update Patient
                </button>
              )}
              <button
                onClick={() => setSelectedPatient(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f1f5f9',
                  color: '#0c4a6e',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e2e8f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    </div>
  )
}
