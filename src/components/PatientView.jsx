import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PatientView({ profile }) {
  const [patient, setPatient] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        // find patient row by profile_id
        const { data: pData } = await supabase.from('patients').select('*').eq('profile_id', profile.id).limit(1).single()
        if (!mounted) return
        setPatient(pData || null)
        if (pData) {
          const { data: sData } = await supabase.from('schedules').select('*').eq('patient_id', pData.id).order('start_time', { ascending: true }).limit(20)
          setSchedules(sData || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <p>Loading patient data...</p>
  if (!patient) return <p>No patient profile found — please create one in your account.</p>

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Patient — {patient.name}</h2>
      <p><strong>Phone:</strong> {patient.phone}</p>
      <p><strong>Email:</strong> {patient.email}</p>
      <p><strong>Address:</strong> {patient.address}</p>

      <h3 style={{ marginTop: 18 }}>Upcoming Visits</h3>
      {schedules.length === 0 && <p>No upcoming visits.</p>}
      {schedules.length > 0 && (
        <ul>
          {schedules.map(s => (
            <li key={s.id}>{new Date(s.start_time).toLocaleString()} — {s.status} — {s.notes}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
