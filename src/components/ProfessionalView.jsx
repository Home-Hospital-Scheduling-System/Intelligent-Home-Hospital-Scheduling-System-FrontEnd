import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ProfessionalView({ profile }) {
  const [professionalData, setProfessionalData] = useState(null)
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
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
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

      <div style={{ marginTop: '2rem', color: '#64748b' }}>
        <p>More features coming soon: schedule management, patient assignments, and more.</p>
      </div>
    </div>
  )
}
