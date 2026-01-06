import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import EditPatientPreferences from './EditPatientPreferences'

export default function PatientView({ profile }) {
  const [patient, setPatient] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  const [professionalDetails, setProfessionalDetails] = useState({})
  const [expandedVisit, setExpandedVisit] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        // Find patient row by profile_id
        const { data: pData, error: pError } = await supabase
          .from('patients')
          .select('*')
          .eq('profile_id', profile.id)
          .limit(1)
          .single()

        if (pError) throw pError
        if (!mounted) return

        setPatient(pData || null)

        if (pData) {
          // Fetch assignments (professionals assigned to this patient)
          const { data: assignData, error: assignError } = await supabase
            .from('patient_assignments')
            .select('*, professionals(id, kind, specialty, profile_id)')
            .eq('patient_id', pData.id)
            .eq('status', 'active')

          if (assignError) console.error('Error fetching assignments:', assignError)
          else setAssignments(assignData || [])

          // Fetch upcoming schedules
          const now = new Date().toISOString()
          const { data: schedData, error: schedError } = await supabase
            .from('schedules')
            .select('*, professionals(id, kind, specialty, profile_id), patients(area, care_needed, visit_time_flexibility, visit_notes)')
            .eq('patient_id', pData.id)
            .gte('start_time', now)
            .order('start_time', { ascending: true })
            .limit(20)

          if (schedError) console.error('Error fetching schedules:', schedError)
          else setSchedules(schedData || [])

          // Fetch professional details for each assignment
          if (assignData && assignData.length > 0) {
            const proIds = assignData.map(a => a.professionals?.profile_id).filter(Boolean)
            if (proIds.length > 0) {
              const { data: profiles, error: profError } = await supabase
                .from('profiles')
                .select('id, full_name, phone, email')
                .in('id', proIds)

              if (!profError && profiles) {
                const proMap = {}
                profiles.forEach(p => {
                  proMap[p.id] = p
                })
                setProfessionalDetails(proMap)
              }
            }
          }
        }
      } catch (e) {
        console.error(e)
        setError('Failed to load patient data: ' + e.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [profile])

  const handlePreferencesUpdated = () => {
    // Reload patient data after preferences update
    const load = async () => {
      const { data: pData } = await supabase
        .from('patients')
        .select('*')
        .eq('profile_id', profile.id)
        .limit(1)
        .single()
      setPatient(pData)
    }
    load()
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading your patient profile...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'crimson' }}>
        <p>No patient profile found — please create one in your account settings.</p>
      </div>
    )
  }

  const upcomingVisits = schedules.filter(s => new Date(s.start_time) > new Date())
  const pastVisits = schedules.filter(s => new Date(s.start_time) <= new Date())

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
            fontWeight: 'bold',
            transition: 'background-color 0.3s'
          }}
          title="View Your Profile"
          onMouseOver={(e) => e.target.style.backgroundColor = '#0284c7'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#0ea5e9'}
        >
          👤
        </button>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#991b1b'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Upcoming Visits Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e', fontSize: '1.5rem' }}>
              📅 Upcoming Visits
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
              Your scheduled appointments and healthcare professional visits
            </p>
          </div>

          {upcomingVisits.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              color: '#64748b'
            }}>
              <p style={{ fontSize: '1.1rem', margin: 0 }}>No upcoming visits scheduled.</p>
              <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>Your coordinator will schedule visits for you.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {upcomingVisits.map((visit, idx) => {
                const startTime = new Date(visit.start_time)
                const endTime = new Date(visit.end_time)
                const pro = visit.professionals
                const proInfo = professionalDetails[pro?.profile_id]
                const isExpanded = expandedVisit === visit.id

                return (
                  <div
                    key={visit.id}
                    style={{
                      border: '2px solid #0ea5e9',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      backgroundColor: '#f0f9ff',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                    onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {/* Visit Header */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '1rem',
                      alignItems: 'start'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          color: '#0c4a6e',
                          marginBottom: '0.5rem'
                        }}>
                          🏥 Visit #{idx + 1}
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem', color: '#475569', fontSize: '0.95rem' }}>
                          <div>
                            <strong>📆 Date:</strong> {startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <div>
                            <strong>🕐 Time:</strong> {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {visit.patients?.care_needed && (
                            <div>
                              <strong>🏥 Care Type:</strong> {visit.patients.care_needed}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#dbeafe',
                          color: '#0c4a6e',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}>
                          {visit.status || 'Scheduled'}
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '1.2rem' }}>
                          {isExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div style={{
                        marginTop: '1.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid #bfdbfe',
                        display: 'grid',
                        gap: '1rem'
                      }}>
                        {/* Professional Info */}
                        {pro && proInfo && (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '6px',
                            border: '1px solid #cffafe'
                          }}>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0c4a6e', marginBottom: '0.75rem' }}>
                              👨‍⚕️ Healthcare Professional
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem', color: '#475569', fontSize: '0.95rem' }}>
                              <div>
                                <strong>Name:</strong> {proInfo.full_name}
                              </div>
                              <div>
                                <strong>Type:</strong> {pro.kind.charAt(0).toUpperCase() + pro.kind.slice(1)}
                              </div>
                              <div>
                                <strong>Specialty:</strong> {pro.specialty}
                              </div>
                              <div>
                                <strong>📧 Email:</strong> {proInfo.email}
                              </div>
                              <div>
                                <strong>📱 Phone:</strong> {proInfo.phone || 'Not available'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Visit Notes */}
                        {visit.notes && (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '6px',
                            border: '1px solid #fcd34d'
                          }}>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>
                              📝 Visit Notes
                            </div>
                            <div style={{ color: '#78350f', fontSize: '0.95rem' }}>
                              {visit.notes}
                            </div>
                          </div>
                        )}

                        {/* Patient Scheduling Preferences */}
                        {(visit.patients?.visit_time_flexibility || visit.patients?.visit_notes) && (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db'
                          }}>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
                              ⏱️ Scheduling Details
                            </div>
                            {visit.patients?.visit_time_flexibility && (
                              <div style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                                <strong>Flexibility:</strong> {visit.patients.visit_time_flexibility.replace(/_/g, ' ')}
                              </div>
                            )}
                            {visit.patients?.visit_notes && (
                              <div style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                                <strong>Special Notes:</strong> {visit.patients.visit_notes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reminder */}
                        <div style={{
                          backgroundColor: '#fef3c7',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #fcd34d',
                          color: '#78350f',
                          fontSize: '0.9rem'
                        }}>
                          <strong>💡 Tip:</strong> Contact your healthcare professional if you need to reschedule this visit.
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Assigned Professionals Section */}
        {assignments.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e', fontSize: '1.5rem' }}>
                👥 Your Assigned Healthcare Professionals
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
                The healthcare professionals assigned to manage your care
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {assignments.map(assignment => {
                const pro = assignment.professionals
                const proInfo = professionalDetails[pro?.profile_id]

                return (
                  <div
                    key={assignment.id}
                    style={{
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      backgroundColor: '#ecfdf5'
                    }}
                  >
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#047857',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      👨‍⚕️ {proInfo?.full_name || 'Professional'}
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem', color: '#475569', fontSize: '0.95rem' }}>
                      <div>
                        <strong>Type:</strong> {pro?.kind.charAt(0).toUpperCase() + pro?.kind.slice(1)}
                      </div>
                      <div>
                        <strong>Specialty:</strong> {pro?.specialty}
                      </div>
                      {proInfo?.email && (
                        <div>
                          <strong>📧 Email:</strong> {proInfo.email}
                        </div>
                      )}
                      {proInfo?.phone && (
                        <div>
                          <strong>📱 Phone:</strong> {proInfo.phone}
                        </div>
                      )}
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Status:</strong> <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          textTransform: 'capitalize'
                        }}>
                          {assignment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Personal Profile Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e', fontSize: '1.5rem' }}>
              ℹ️ Your Personal Profile
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
              Your account and healthcare information
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#0c4a6e', fontWeight: '500', marginBottom: '0.5rem' }}>
                👤 Full Name
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                {profile.full_name}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fcd34d'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '500', marginBottom: '0.5rem' }}>
                📧 Email
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#92400e' }}>
                {profile.email}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#f5f3ff',
              borderRadius: '8px',
              border: '1px solid #e9d5ff'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6b21a8', fontWeight: '500', marginBottom: '0.5rem' }}>
                📱 Phone
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#6b21a8' }}>
                {profile.phone || 'Not provided'}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#fecaca',
              borderRadius: '8px',
              border: '1px solid #fca5a5'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: '500', marginBottom: '0.5rem' }}>
                📍 Address
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#991b1b' }}>
                {patient.address || 'Not provided'}
              </div>
            </div>
          </div>

          {/* Visit Preferences Card */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#ecfdf5',
            borderRadius: '8px',
            border: '2px solid #10b981',
            marginBottom: '1.5rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#047857', marginBottom: '0.5rem' }}>
                ⏱️ Your Visit Scheduling Preferences
              </div>
              <p style={{ margin: 0, color: '#059669', fontSize: '0.9rem' }}>
                These preferences help coordinators schedule visits that work best for you
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              {patient.preferred_visit_time && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #a7f3d0'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: '500' }}>
                    🕐 Preferred Time
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#065f46', marginTop: '0.25rem' }}>
                    {patient.preferred_visit_time}
                  </div>
                </div>
              )}

              {patient.visit_time_flexibility && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #a7f3d0'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: '500' }}>
                    🎯 Time Flexibility
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#065f46', marginTop: '0.25rem' }}>
                    {patient.visit_time_flexibility.replace(/_/g, ' ')}
                  </div>
                </div>
              )}
            </div>

            {patient.visit_notes && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #a7f3d0',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: '500', marginBottom: '0.25rem' }}>
                  📝 Special Notes
                </div>
                <div style={{ fontSize: '0.95rem', color: '#065f46' }}>
                  {patient.visit_notes}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowPreferencesModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              ✏️ Edit Preferences
            </button>
          </div>

          {/* Medical Notes */}
          {patient.medical_notes && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '2px solid #fca5a5'
            }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#991b1b', marginBottom: '0.75rem' }}>
                🏥 Medical Notes
              </div>
              <p style={{ margin: 0, color: '#7c2d12', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                {patient.medical_notes}
              </p>
            </div>
          )}
        </div>
      </div>

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
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, color: '#0c4a6e' }}>👤 Your Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <strong>👤 Full Name:</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#475569' }}>{profile.full_name}</p>
              </div>
              <div>
                <strong>📧 Email:</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#475569' }}>{profile.email}</p>
              </div>
              <div>
                <strong>📱 Phone:</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#475569' }}>{profile.phone || 'Not provided'}</p>
              </div>
              <div>
                <strong>🏠 Address:</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#475569' }}>{patient.address || 'Not provided'}</p>
              </div>
              <div>
                <strong>🏥 Care Needs:</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#475569' }}>{patient.care_needed || 'Not specified'}</p>
              </div>
            </div>

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
                fontWeight: 'bold',
                fontSize: '0.95rem'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferencesModal && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <EditPatientPreferences
              patient={patient}
              onClose={() => setShowPreferencesModal(false)}
              onUpdated={handlePreferencesUpdated}
            />
          </div>
        </div>
      )}
    </div>
  )
}
