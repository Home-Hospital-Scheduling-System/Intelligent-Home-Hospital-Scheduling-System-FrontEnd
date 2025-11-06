import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PatientsList() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase.from('patients').select('*').order('id', { ascending: true })
      if (!mounted) return
      if (error) {
        setError(error.message)
        setPatients([])
      } else {
        setPatients(data || [])
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) return <p>Loading patients...</p>
  if (error) return <p style={{ color: 'crimson' }}>Error: {error}</p>
  if (!patients.length) return <p>No patients found. Create some rows in Supabase.</p>

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Patients</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Name</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Phone</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(p => (
            <tr key={p.id}>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{p.id}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{p.name}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{p.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
