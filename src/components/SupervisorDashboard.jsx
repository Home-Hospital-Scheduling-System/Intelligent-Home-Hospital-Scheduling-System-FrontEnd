import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { apiGet, apiPut, apiDelete } from '../lib/apiClient'

export default function SupervisorDashboard({ profile }) {
  const [stats, setStats] = useState({
    totalPatients: 0,
    patientsByArea: {},
    patientsByCare: {},
    professionalCount: 0
  })
  const [allPatients, setAllPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedArea, setSelectedArea] = useState(null)
  const [selectedCare, setSelectedCare] = useState(null)
  const [professionals, setProfessionals] = useState([])
  const [proModalOpen, setProModalOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState(null)
  const [workingHours, setWorkingHours] = useState([])
  const [allWorkingHours, setAllWorkingHours] = useState({}) // Store working hours for all professionals
  const [whForm, setWhForm] = useState({ weekday: '1', start_time: '09:00', end_time: '17:00', isRecurring: true })
  const [whSaving, setWhSaving] = useState(false)
  const [whMessage, setWhMessage] = useState({ error: '', success: '' })
  const [confirmModal, setConfirmModal] = useState({ show: false, workingHourId: null })

  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      // Fetch all patients via backend
      const patientsData = await apiGet('/api/patients')
      setAllPatients(patientsData || [])

      // Calculate statistics
      const totalPatients = patientsData?.length || 0
      const patientsByArea = {}
      const patientsByCare = {}

      patientsData?.forEach(patient => {
        // Count by area
        if (patient.area) {
          patientsByArea[patient.area] = (patientsByArea[patient.area] || 0) + 1
        }
        // Count by care needed
        if (patient.care_needed) {
          patientsByCare[patient.care_needed] = (patientsByCare[patient.care_needed] || 0) + 1
        }
      })

      setStats({
        totalPatients,
        patientsByArea,
        patientsByCare,
        professionalCount: 0
      })

      // Fetch professional count via backend
      const professionalsData = await apiGet('/api/professionals')
      setStats(prev => ({
        ...prev,
        professionalCount: professionalsData?.length || 0
      }))

      // Preload professionals for the modal
      await fetchProfessionals()
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProfessionals() {
    try {
      const data = await apiGet('/api/professionals')
      setProfessionals(data || [])
      // Fetch working hours for all professionals
      if (data && data.length > 0) {
        fetchAllWorkingHours(data.map(p => p.profile_id))
      }
    } catch (err) {
      console.error('Error fetching professionals:', err)
      setProfessionals([])
    }
  }

  async function fetchAllWorkingHours(professionalIds) {
    try {
      const allHours = {}
      // Fetch working hours for each professional
      for (const profId of professionalIds) {
        const data = await apiGet(`/api/professionals/${profId}/working-hours`)
        allHours[profId] = data || []
      }
      setAllWorkingHours(allHours)
    } catch (err) {
      console.error('Error fetching all working hours:', err)
      setAllWorkingHours({})
    }
  }

  async function fetchWorkingHours(professionalId) {
    try {
      const data = await apiGet(`/api/professionals/${professionalId}/working-hours`)
      setWorkingHours(data || [])
    } catch (err) {
      console.error('Error fetching working hours:', err)
      setWorkingHours([])
    }
  }

  function openProfessionalModal() {
    setProModalOpen(true)
    setSelectedProfessional(null)
    setWorkingHours([])
  }

  function closeProfessionalModal() {
    setProModalOpen(false)
    setSelectedProfessional(null)
    setWorkingHours([])
    setWhMessage({ error: '', success: '' })
  }

  function selectProfessional(pro) {
    setSelectedProfessional(pro)
    setWhMessage({ error: '', success: '' })
    setWhForm({ weekday: '1', start_time: '09:00', end_time: '17:00', isRecurring: true })
    // Use profile_id (UUID) for working-hours endpoint
    fetchWorkingHours(pro.profile_id)
  }

  function handleWhFormChange(e) {
    const { name, value, type, checked } = e.target
    setWhForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function calculateTotalHours(hours) {
    if (!hours || hours.length === 0) return 0
    let total = 0
    hours.forEach(w => {
      const start = new Date(`2000-01-01 ${w.start_time}`)
      const end = new Date(`2000-01-01 ${w.end_time}`)
      const diff = (end - start) / (1000 * 60 * 60) // hours
      total += diff
    })
    return total.toFixed(1)
  }

  async function handleSaveWorkingHours() {
    if (!selectedProfessional) return
    setWhSaving(true)
    setWhMessage({ error: '', success: '' })

    const weekdayNum = parseInt(whForm.weekday, 10)
    const existing = workingHours.find(w => w.weekday === weekdayNum)

    const payload = {
      professional_id: selectedProfessional.id,
      weekday: weekdayNum,
      start_time: whForm.start_time,
      end_time: whForm.end_time,
      is_recurring: whForm.isRecurring,
      assigned_by_profile: profile.id
    }

    // Only include id for updates (existing record), omit for inserts
    if (existing?.id) {
      payload.id = existing.id
    }

    try {
      await apiPut(`/api/professionals/${selectedProfessional.profile_id}/working-hours`, { working_hours: [payload] })
      setWhMessage({ error: '', success: 'Working hours saved' })
      fetchWorkingHours(selectedProfessional.profile_id)
      // Refresh all working hours for the list view
      fetchAllWorkingHours(professionals.map(p => p.profile_id))
    } catch (error) {
      setWhMessage({ error: error.message, success: '' })
    }

    setWhSaving(false)
  }

  async function handleDeleteWorkingHours(workingHourId) {
    if (!selectedProfessional) return
    setConfirmModal({ show: true, workingHourId })
  }

  async function confirmDeleteWorkingHours() {
    if (!confirmModal.workingHourId) return
    setConfirmModal({ show: false, workingHourId: null })

    try {
      await apiDelete(`/api/professionals/${selectedProfessional.profile_id}/working-hours/${confirmModal.workingHourId}`)
      setWhMessage({ error: '', success: 'Time slot deleted' })
      fetchWorkingHours(selectedProfessional.profile_id)
      // Refresh all working hours for the list view
      fetchAllWorkingHours(professionals.map(p => p.profile_id))
    } catch (error) {
      setWhMessage({ error: 'Failed to delete: ' + error.message, success: '' })
    }
  }

  function cancelDeleteWorkingHours() {
    setConfirmModal({ show: false, workingHourId: null })
  }

  const filteredPatients = allPatients.filter(patient => {
    const areaMatch = !selectedArea || patient.area === selectedArea
    const careMatch = !selectedCare || patient.care_needed === selectedCare
    return areaMatch && careMatch
  })

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading supervisor dashboard...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Supervisor Dashboard</h1>

      {/* Welcome Section */}
      <div style={{
        background: '#f0f9ff',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid #0ea5e9'
      }}>
        <h2 style={{ marginTop: 0, color: '#0c4a6e' }}>Welcome, {profile.full_name}</h2>
        <p style={{ margin: '0.5rem 0 0 0', color: '#475569' }}>Manage and monitor patient care assignments across your organization.</p>
      </div>

      {/* Key Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          border: '1px solid #0ea5e9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
            {stats.totalPatients}
          </div>
          <div style={{ color: '#475569', marginTop: '0.5rem', fontWeight: '500' }}>
            Total Patients
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          border: '1px solid #0ea5e9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
            {Object.keys(stats.patientsByArea).length}
          </div>
          <div style={{ color: '#475569', marginTop: '0.5rem', fontWeight: '500' }}>
            Service Areas
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          border: '1px solid #0ea5e9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
            {Object.keys(stats.patientsByCare).length}
          </div>
          <div style={{ color: '#475569', marginTop: '0.5rem', fontWeight: '500' }}>
            Types of Care
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          border: '1px solid #0ea5e9',
          textAlign: 'center'
        }} onClick={openProfessionalModal} role="button">
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
            {stats.professionalCount}
          </div>
          <div style={{ color: '#475569', marginTop: '0.5rem', fontWeight: '500' }}>
            Healthcare Professionals
          </div>
          <div style={{ marginTop: '0.5rem', color: '#0ea5e9', fontSize: '0.9rem' }}>
            View & assign hours
          </div>
        </div>
      </div>

      {/* Patients by Area */}
      {Object.keys(stats.patientsByArea).length > 0 && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginTop: 0, color: '#0c4a6e' }}>Patients by Service Area</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {Object.entries(stats.patientsByArea).map(([area, count]) => (
              <button
                key={area}
                onClick={() => setSelectedArea(selectedArea === area ? null : area)}
                style={{
                  padding: '1rem',
                  backgroundColor: selectedArea === area ? '#0ea5e9' : '#e0f2fe',
                  color: selectedArea === area ? 'white' : '#0c4a6e',
                  border: '1px solid #0ea5e9',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{count}</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{area}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Patients by Care Type */}
      {Object.keys(stats.patientsByCare).length > 0 && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginTop: 0, color: '#0c4a6e' }}>Patients by Care Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {Object.entries(stats.patientsByCare).map(([care, count]) => (
              <button
                key={care}
                onClick={() => setSelectedCare(selectedCare === care ? null : care)}
                style={{
                  padding: '1rem',
                  backgroundColor: selectedCare === care ? '#10b981' : '#d1fae5',
                  color: selectedCare === care ? 'white' : '#0c4a6e',
                  border: '1px solid #10b981',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{count}</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{care}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtered Patients List */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ marginTop: 0, color: '#0c4a6e' }}>
          Patient Details ({filteredPatients.length} shown)
          {(selectedArea || selectedCare) && (
            <button
              onClick={() => {
                setSelectedArea(null)
                setSelectedCare(null)
              }}
              style={{
                marginLeft: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Clear Filters
            </button>
          )}
        </h3>

        {filteredPatients.length === 0 ? (
          <div style={{ color: '#64748b', padding: '1rem', textAlign: 'center' }}>
            {stats.totalPatients === 0
              ? 'No patients yet. Professionals will add patients here.'
              : 'No patients match the selected filters.'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {filteredPatients.map(patient => (
              <div
                key={patient.id}
                style={{
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#0c4a6e' }}>
                  {patient.name}
                </h4>
                {patient.phone && (
                  <p style={{ margin: '0.25rem 0', color: '#475569', fontSize: '0.875rem' }}>
                    <strong>Phone:</strong> {patient.phone}
                  </p>
                )}
                {patient.address && (
                  <p style={{ margin: '0.25rem 0', color: '#475569', fontSize: '0.875rem' }}>
                    <strong>Address:</strong> {patient.address}
                  </p>
                )}
                {patient.area && (
                  <p style={{ margin: '0.25rem 0', color: '#475569', fontSize: '0.875rem' }}>
                    <strong>Area:</strong> {patient.area}
                  </p>
                )}
                {patient.care_needed && (
                  <p style={{ margin: '0.25rem 0', color: '#475569', fontSize: '0.875rem' }}>
                    <strong>Care:</strong> {patient.care_needed}
                  </p>
                )}
                {patient.next_appointment_date && (
                  <p style={{ margin: '0.25rem 0', color: '#475569', fontSize: '0.875rem' }}>
                    <strong>Next Apt:</strong> {new Date(patient.next_appointment_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Professionals Modal */}
      {proModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            width: '95%',
            maxWidth: '1100px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 12px 48px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h2 style={{ margin: 0, color: '#0c4a6e' }}>Healthcare Professionals</h2>
              <button onClick={closeProfessionalModal} style={{
                border: 'none',
                background: 'none',
                fontSize: '1.4rem',
                cursor: 'pointer',
                color: '#64748b'
              }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: '420px' }}>
              <div style={{ borderRight: '1px solid #e2e8f0', overflowY: 'auto', maxHeight: '75vh' }}>
                {professionals.length === 0 ? (
                  <p style={{ padding: '1rem', color: '#475569' }}>No professionals found.</p>
                ) : (
                  professionals.map(pro => {
                    const proHours = allWorkingHours[pro.profile_id] || []
                    const totalHours = calculateTotalHours(proHours)
                    return (
                      <div
                        key={pro.id}
                        onClick={() => selectProfessional(pro)}
                        style={{
                          padding: '1rem 1.25rem',
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: selectedProfessional?.id === pro.id ? '#e0f2fe' : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#0c4a6e' }}>{pro.profiles?.full_name || 'Unknown'}</div>
                          <div style={{ color: '#475569', fontSize: '0.9rem' }}>{pro.profiles?.role || 'professional'}</div>
                          <div style={{ color: '#0ea5e9', fontSize: '0.9rem', marginTop: '0.25rem' }}>{pro.specialty}</div>
                        </div>
                        <div style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: totalHours > 0 ? '#dbeafe' : '#f1f5f9',
                          borderRadius: '6px',
                          border: `1px solid ${totalHours > 0 ? '#0ea5e9' : '#cbd5e1'}`,
                          textAlign: 'center',
                          minWidth: '60px'
                        }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                            {totalHours}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>hrs</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>
                {!selectedProfessional && (
                  <p style={{ color: '#475569' }}>Select a professional to view and assign weekly working hours.</p>
                )}

                {selectedProfessional && (
                  <>
                    <div style={{ 
                      marginBottom: '1.5rem', 
                      padding: '1rem', 
                      background: '#f0f9ff', 
                      borderRadius: '8px', 
                      border: '2px solid #0ea5e9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1.5rem'
                    }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>
                          {selectedProfessional.profiles?.full_name}
                        </h3>
                        <div style={{ color: '#475569', marginBottom: '0.25rem' }}>{selectedProfessional.profiles?.role || 'professional'}</div>
                        <div style={{ color: '#0ea5e9' }}>{selectedProfessional.specialty}</div>
                      </div>
                      <div style={{
                        padding: '0.75rem 1.25rem',
                        background: '#dbeafe',
                        borderRadius: '6px',
                        border: '1px solid #0ea5e9',
                        textAlign: 'center',
                        minWidth: '150px'
                      }}>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>Total Weekly Hours</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                          {calculateTotalHours(workingHours)} hrs
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>Assigned Weekly Hours</h4>
                      {workingHours.length === 0 ? (
                        <p style={{ color: '#475569' }}>No working hours assigned yet.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                          {workingHours.map(w => (
                            <div key={w.id} style={{
                              padding: '0.75rem 1rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              background: '#f8fafc',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div>
                                <div style={{ fontWeight: 600, color: '#0c4a6e' }}>{WEEKDAYS[w.weekday - 1]}</div>
                                <div style={{ color: '#475569', marginTop: '0.25rem' }}>
                                  {w.start_time} - {w.end_time} {w.is_recurring ? '(recurring)' : ''}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteWorkingHours(w.id)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: '#fee2e2',
                                  color: '#991b1b',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f0f9ff' }}>
                      <h4 style={{ marginTop: 0, color: '#0c4a6e' }}>Assign / Update Weekly Hours</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <label style={{ display: 'block', color: '#475569', marginBottom: '0.4rem' }}>Weekday</label>
                          <select name="weekday" value={whForm.weekday} onChange={handleWhFormChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            {WEEKDAYS.map((d, idx) => (
                              <option key={d} value={idx + 1}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', color: '#475569', marginBottom: '0.4rem' }}>Start Time</label>
                          <input type="time" name="start_time" value={whForm.start_time} onChange={handleWhFormChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: '#475569', marginBottom: '0.4rem' }}>End Time</label>
                          <input type="time" name="end_time" value={whForm.end_time} onChange={handleWhFormChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.6rem' }}>
                          <input type="checkbox" id="isRecurring" name="isRecurring" checked={whForm.isRecurring} onChange={handleWhFormChange} />
                          <label htmlFor="isRecurring" style={{ color: '#475569' }}>Recurrent every week</label>
                        </div>
                      </div>

                      {whMessage.error && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b' }}>
                          {whMessage.error}
                        </div>
                      )}
                      {whMessage.success && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', color: '#166534' }}>
                          {whMessage.success}
                        </div>
                      )}

                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleSaveWorkingHours}
                          disabled={whSaving}
                          style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: whSaving ? '#93c5fd' : '#0ea5e9',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: whSaving ? 'not-allowed' : 'pointer',
                            fontWeight: 600
                          }}
                        >
                          {whSaving ? 'Saving...' : 'Save / Update'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>Delete Time Slot?</h3>
            <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
              Are you sure you want to delete this working hours slot? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={cancelDeleteWorkingHours}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f1f5f9',
                  color: '#0c4a6e',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWorkingHours}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
