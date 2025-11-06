import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function CoordinatorSchedules() {
  const [schedules, setSchedules] = useState([])
  const [patients, setPatients] = useState({})
  const [locations, setLocations] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadAll() {
      setLoading(true)
      try {
        const [{ data: schedulesData, error: sErr }, { data: patientsData, error: pErr }, { data: locationsData, error: lErr }] = await Promise.all([
          supabase.from('schedules').select('*').order('start_time', { ascending: true }),
          supabase.from('patients').select('id, name'),
          supabase.from('locations').select('id, name')
        ])

        if (!mounted) return

        if (sErr) throw sErr
        if (pErr) throw pErr
        if (lErr) throw lErr

        const patientsMap = (patientsData || []).reduce((acc, p) => { acc[p.id] = p.name; return acc }, {})
        const locationsMap = (locationsData || []).reduce((acc, l) => { acc[l.id] = l.name; return acc }, {})

        setSchedules(schedulesData || [])
        setPatients(patientsMap)
        setLocations(locationsMap)
        setError(null)
      } catch (e) {
        setError(e.message || String(e))
        setSchedules([])
      } finally {
        setLoading(false)
      }
    }
    loadAll()
    return () => { mounted = false }
  }, [])

  if (loading) return <p>Loading upcoming visits...</p>
  if (error) return <p style={{ color: 'crimson' }}>Error: {error}</p>

  // Show only future or ongoing visits
  const now = new Date()
  const upcoming = schedules.filter(s => new Date(s.end_time) >= now).slice(0, 20)

  if (!upcoming.length) return <p>No upcoming visits found.</p>

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Coordinator — Upcoming Visits</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Time</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Patient</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Professional ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Location</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Status</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {upcoming.map(s => (
            <tr key={s.id}>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                {new Date(s.start_time).toLocaleString()} - {new Date(s.end_time).toLocaleTimeString()}
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{patients[s.patient_id] || `#${s.patient_id}`}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{s.professional_id ? `#${s.professional_id}` : 'Unassigned'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{locations[s.location_id] || `#${s.location_id}`}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{s.status}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{s.notes || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
