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
  if (error) return <p className="muted" style={{ color: 'crimson' }}>Error: {error}</p>

  // Show only future or ongoing visits
  const now = new Date()
  const upcoming = schedules.filter(s => new Date(s.end_time) >= now).slice(0, 20)

  if (!upcoming.length) return <p>No upcoming visits found.</p>

  return (
    <div className="schedules-section">
      <h2>Coordinator — Upcoming Visits</h2>
      <table className="schedules-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Patient</th>
            <th>Professional</th>
            <th>Location</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {upcoming.map(s => (
            <tr key={s.id}>
              <td className="time-cell">
                {new Date(s.start_time).toLocaleString()}<br/>
                <small className="muted">{new Date(s.end_time).toLocaleTimeString()}</small>
              </td>
              <td>{patients[s.patient_id] || `#${s.patient_id}`}</td>
              <td>{s.professional_id ? `#${s.professional_id}` : 'Unassigned'}</td>
              <td>{locations[s.location_id] || `#${s.location_id}`}</td>
              <td>
                <span className={`status-chip ${'status-' + (s.status || 'scheduled')}`}>{s.status}</span>
              </td>
              <td>{s.notes || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
