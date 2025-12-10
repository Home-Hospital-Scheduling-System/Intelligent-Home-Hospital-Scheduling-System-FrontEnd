import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// List of professional specialties
const PROFESSIONAL_SPECIALTIES = [
  'Wound Care Specialist',
  'Community Nursing',
  'Cardiology',
  'General Practice',
  'Physiotherapy',
  'Counseling',
  'Occupational Therapy',
  'Other (please specify)'
]

export default function Auth({ onUser }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // signup fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('patient')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  
  // role-specific fields
  const [address, setAddress] = useState('') // for patients
  const [professionalKind, setProfessionalKind] = useState('nurse') // 'doctor', 'nurse', 'therapist'
  const [specialty, setSpecialty] = useState('Community Nursing')
  const [otherSpecialty, setOtherSpecialty] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // when auth state changes, notify parent to refresh
      onUser(session?.user ?? null)
    })
    return () => listener?.subscription?.unsubscribe && listener.subscription.unsubscribe()
  }, [onUser])

  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      // Trim whitespace from email and password
      const trimmedEmail = email.trim()
      const trimmedPassword = password.trim()
      
      console.log('Attempting sign in with email:', trimmedEmail)
      const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password: trimmedPassword })
      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
      console.log('Sign in successful, user:', data.user?.email)
      setMessage('Signed in')
      onUser(data.user)
    } catch (err) {
      console.error('Sign in exception:', err)
      setMessage(err.message || 'Sign in failed. Please check your credentials.')
    } finally { setLoading(false) }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    // Validate email is not empty
    if (!email || email.trim() === '') {
      setMessage('Email is required')
      setLoading(false)
      return
    }
    
    try {
      // Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError

      // Try to sign in immediately (may fail until email confirmed depending on Supabase settings)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      const user = signInData?.user ?? signUpData?.user

      if (!user) {
        // unable to get user session yet (email confirm required). Save signup meta locally.
        const pendingData = { fullName, phone, role, email, address, professionalKind, specialty: specialty === 'Other (please specify)' ? otherSpecialty : specialty, licenseNumber }
        localStorage.setItem('hhss_pending_profile_' + email, JSON.stringify(pendingData))
        setMessage('Sign up success — please confirm your email. After confirmation sign in and your profile will be created automatically.')
        return
      }

      // Create profile row in DB (id must match auth user id)
      const profile = {
        id: user.id,
        full_name: fullName,
        email: email,
        phone: phone || null,
        role: role
      }
      const { error: pErr } = await supabase.from('profiles').insert(profile)
      if (pErr) {
        console.warn('Profile insert error', pErr.message)
        throw new Error('Failed to create profile: ' + pErr.message)
      }

      // If user is a patient, create a patients row
      if (role === 'patient') {
        const patientData = { profile_id: user.id, address: address || null, medical_notes: '' }
        console.log('Inserting patient:', patientData)
        const { error: pErr, data: pData } = await supabase.from('patients').insert(patientData)
        if (pErr) {
          console.warn('Patient insert error:', pErr.message)
        } else {
          console.log('Patient inserted successfully:', pData)
        }
      }

      // If user is a professional, create a professionals row
      if (role === 'professional') {
        const finalSpecialty = specialty === 'Other (please specify)' ? otherSpecialty : specialty
        const professionalData = { profile_id: user.id, kind: professionalKind, specialty: finalSpecialty, license_number: licenseNumber || null }
        console.log('Inserting professional:', professionalData)
        const { error: proErr, data: proData } = await supabase.from('professionals').insert(professionalData)
        if (proErr) {
          console.warn('Professional insert error:', proErr.message)
        } else {
          console.log('Professional inserted successfully:', proData)
        }
      }

      setMessage('Sign up complete — signed in')
      onUser(user)
    } catch (err) {
      console.error('Sign up error:', err)
      setMessage(err.message || 'Sign up failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ marginTop: 20, maxWidth: 500 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button onClick={() => setMode('signin')} className={mode==='signin'?'active':''}>Sign in</button>
        <button onClick={() => setMode('signup')} className={mode==='signup'?'active':''}>Sign up</button>
      </div>

      <form onSubmit={mode==='signin' ? handleSignIn : handleSignUp}>
        <label style={{ display: 'block', marginBottom: 6 }}>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{ width: '100%', padding: 6 }} />

        <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{ width: '100%', padding: 6 }} />

        {mode === 'signup' && (
          <>
            <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Full name</label>
            <input value={fullName} onChange={e=>setFullName(e.target.value)} required style={{ width: '100%', padding: 6 }} />

            <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Phone</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} style={{ width: '100%', padding: 6 }} />

            <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)} style={{ width: '100%', padding: 6 }}>
              <option value="patient">Patient</option>
              <option value="professional">Professional (Doctor/Nurse)</option>
              <option value="coordinator">Coordinator</option>
              <option value="supervisor">Supervisor</option>
            </select>

            {/* PATIENT-SPECIFIC FIELDS */}
            {role === 'patient' && (
              <>
                <label style={{ display: 'block', marginTop: 12, marginBottom: 6 }}>
                  <strong>Address (home)</strong>
                </label>
                <textarea
                  value={address}
                  onChange={e=>setAddress(e.target.value)}
                  placeholder="e.g., House 12, Street Name, City"
                  style={{ width: '100%', padding: 6, minHeight: 60, fontFamily: 'inherit' }}
                />
              </>
            )}

            {/* PROFESSIONAL-SPECIFIC FIELDS */}
            {role === 'professional' && (
              <>
                <label style={{ display: 'block', marginTop: 12, marginBottom: 6 }}>
                  <strong>Professional Type</strong>
                </label>
                <select value={professionalKind} onChange={e=>setProfessionalKind(e.target.value)} style={{ width: '100%', padding: 6 }}>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="therapist">Therapist</option>
                  <option value="counselor">Counselor</option>
                  <option value="other">Other</option>
                </select>

                <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>
                  <strong>Specialty</strong>
                </label>
                <select value={specialty} onChange={e=>setSpecialty(e.target.value)} style={{ width: '100%', padding: 6 }}>
                  {PROFESSIONAL_SPECIALTIES.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>

                {specialty === 'Other (please specify)' && (
                  <>
                    <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Please specify your specialty</label>
                    <input
                      type="text"
                      value={otherSpecialty}
                      onChange={e=>setOtherSpecialty(e.target.value)}
                      placeholder="e.g., Dental Hygiene"
                      style={{ width: '100%', padding: 6 }}
                    />
                  </>
                )}

                <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>License Number (optional)</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={e=>setLicenseNumber(e.target.value)}
                  placeholder="e.g., LIC-001-2024"
                  style={{ width: '100%', padding: 6 }}
                />
              </>
            )}
          </>
        )}

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 8, cursor: 'pointer' }}>
            {loading ? 'Please wait...' : (mode==='signin' ? 'Sign in' : 'Create account')}
          </button>
        </div>
      </form>

      {message && <p style={{ marginTop: 12, color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
      
      {/* Diagnostic info for email confirmation */}
      <div style={{ marginTop: 20, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 4, fontSize: 12 }}>
        <p><strong>Troubleshooting:</strong></p>
        <ul style={{ marginTop: 8 }}>
          <li>Make sure email and password are correct (case-sensitive)</li>
          <li>If you just signed up, you may need to confirm your email first</li>
          <li>Check browser console (F12) for detailed error messages</li>
          <li>Try signing up again and check for a confirmation email</li>
        </ul>
      </div>
    </div>
  )
}
