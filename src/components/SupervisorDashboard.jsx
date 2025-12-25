import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      // Fetch all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (patientsError) {
        console.error('Error fetching patients:', patientsError)
      } else {
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
      }

      // Fetch professional count
      const { data: professionalsData, error: profError } = await supabase
        .from('professionals')
        .select('id')

      if (!profError) {
        setStats(prev => ({
          ...prev,
          professionalCount: professionalsData?.length || 0
        }))
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
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
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
            {stats.professionalCount}
          </div>
          <div style={{ color: '#475569', marginTop: '0.5rem', fontWeight: '500' }}>
            Healthcare Professionals
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
    </div>
  )
}
