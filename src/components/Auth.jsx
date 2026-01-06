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
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'resetPassword'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // signup fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('professional') // Default to professional since patients can't signup
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  
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

  async function handleResetPassword(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    if (!email || email.trim() === '') {
      setMessage('Please enter your email address')
      setLoading(false)
      return
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      setResetEmailSent(true)
      setMessage('Password reset email sent! Please check your inbox.')
    } catch (err) {
      console.error('Password reset error:', err)
      setMessage(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
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
      {/* Mode selection - Sign in or Sign up (for staff only) */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button 
          onClick={() => { setMode('signin'); setMessage(null); setResetEmailSent(false); }} 
          style={{
            padding: '10px 20px',
            backgroundColor: mode === 'signin' ? '#0ea5e9' : '#e2e8f0',
            color: mode === 'signin' ? 'white' : '#475569',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Sign in
        </button>
        <button 
          onClick={() => { setMode('signup'); setMessage(null); }} 
          style={{
            padding: '10px 20px',
            backgroundColor: mode === 'signup' ? '#0ea5e9' : '#e2e8f0',
            color: mode === 'signup' ? 'white' : '#475569',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Staff Sign up
        </button>
      </div>

      {/* Password Reset Mode */}
      {mode === 'resetPassword' && (
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '8px',
          border: '1px solid #0ea5e9'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0c4a6e' }}>🔐 Reset Password</h3>
          
          {resetEmailSent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
              <p style={{ color: '#065f46', marginBottom: '1rem' }}>
                Password reset email sent!<br />
                Please check your inbox and follow the instructions.
              </p>
              <button
                onClick={() => { setMode('signin'); setResetEmailSent(false); setMessage(null); }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Back to Sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword}>
              <p style={{ color: '#475569', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <label style={{ display: 'block', marginBottom: 6, fontWeight: '500' }}>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }} 
                placeholder="Enter your email"
              />
              
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    backgroundColor: loading ? '#cbd5e1' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setMessage(null); }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#e2e8f0',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
              </div>
              
              {message && (
                <p style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: message.includes('sent') ? '#dcfce7' : '#fee2e2',
                  color: message.includes('sent') ? '#065f46' : '#991b1b'
                }}>
                  {message}
                </p>
              )}
            </form>
          )}
        </div>
      )}

      {/* Sign In Form */}
      {mode === 'signin' && (
        <form onSubmit={handleSignIn}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: '500' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }} 
            placeholder="Enter your email"
          />

          <label style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: '500' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }} 
            placeholder="Enter your password"
          />

          <div style={{ marginTop: '1rem' }}>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: loading ? '#cbd5e1' : '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          {/* Forgot Password Link */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => { setMode('resetPassword'); setMessage(null); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0ea5e9',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.9rem'
              }}
            >
              Forgot your password?
            </button>
          </div>
          
          {message && (
            <p style={{ 
              marginTop: '1rem', 
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: message.includes('success') || message.includes('Signed in') ? '#dcfce7' : '#fee2e2',
              color: message.includes('success') || message.includes('Signed in') ? '#065f46' : '#991b1b'
            }}>
              {message}
            </p>
          )}
          
          {/* Info box for patients */}
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            backgroundColor: '#fef3c7', 
            borderRadius: '8px',
            border: '1px solid #fbbf24',
            fontSize: '0.85rem'
          }}>
            <p style={{ margin: 0, color: '#92400e' }}>
              <strong>👤 Patients:</strong> Your login credentials are provided by your healthcare professional. 
              If you don't have login details, please contact your care provider.
            </p>
          </div>
        </form>
      )}

      {/* Sign Up Form (Staff Only) */}
      {mode === 'signup' && (
        <form onSubmit={handleSignUp}>
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#dbeafe', 
            borderRadius: '6px',
            border: '1px solid #3b82f6'
          }}>
            <p style={{ margin: 0, color: '#1e40af', fontSize: '0.85rem' }}>
              <strong>ℹ️ Staff Registration:</strong> This form is for healthcare professionals, coordinators, and supervisors only. 
              Patients receive their login credentials from their healthcare provider.
            </p>
          </div>

          <label style={{ display: 'block', marginBottom: 6, fontWeight: '500' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }} 
          />

          <label style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: '500' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }} 
          />

          <label style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: '500' }}>Full name</label>
          <input 
            value={fullName} 
            onChange={e => setFullName(e.target.value)} 
            required 
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }} 
          />

          <label style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: '500' }}>Phone</label>
          <input 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }} 
          />

          <label style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: '500' }}>Role</label>
          <select 
            value={role} 
            onChange={e => setRole(e.target.value)} 
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          >
            <option value="professional">Professional (Doctor/Nurse)</option>
            <option value="coordinator">Coordinator</option>
            <option value="supervisor">Supervisor</option>
          </select>

          {/* PROFESSIONAL-SPECIFIC FIELDS */}
          {role === 'professional' && (
            <>
              <label style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: '500' }}>
                Professional Type
              </label>
              <select 
                value={professionalKind} 
                onChange={e => setProfessionalKind(e.target.value)} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              >
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="therapist">Therapist</option>
                <option value="counselor">Counselor</option>
                <option value="other">Other</option>
              </select>

              <label style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: '500' }}>
                Specialty
              </label>
              <select 
                value={specialty} 
                onChange={e => setSpecialty(e.target.value)} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              >
                {PROFESSIONAL_SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>

              {specialty === 'Other (please specify)' && (
                <>
                  <label style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: '500' }}>
                    Please specify your specialty
                  </label>
                  <input
                    type="text"
                    value={otherSpecialty}
                    onChange={e => setOtherSpecialty(e.target.value)}
                    placeholder="e.g., Dental Hygiene"
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </>
              )}

              <label style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: '500' }}>
                License Number (optional)
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value)}
                placeholder="e.g., LIC-001-2024"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: loading ? '#cbd5e1' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Creating account...' : 'Create Staff Account'}
            </button>
          </div>
          
          {message && (
            <p style={{ 
              marginTop: '1rem', 
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: message.includes('success') || message.includes('complete') ? '#dcfce7' : '#fee2e2',
              color: message.includes('success') || message.includes('complete') ? '#065f46' : '#991b1b'
            }}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
