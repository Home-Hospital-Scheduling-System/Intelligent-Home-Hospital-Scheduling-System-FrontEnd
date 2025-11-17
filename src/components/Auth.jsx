import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setMessage('Signed in')
      onUser(data.user)
    } catch (err) {
      setMessage(err.message)
    } finally { setLoading(false) }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      // Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError

      // Try to sign in immediately (may fail until email confirmed depending on Supabase settings)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      const user = signInData?.user ?? signUpData?.user

      if (!user) {
        // unable to get user session yet (email confirm required). Save signup meta locally so we can create profile after confirmation.
        localStorage.setItem('hhss_pending_profile_' + email, JSON.stringify({ fullName, phone, role }))
        setMessage('Sign up success — please confirm your email. After confirmation sign in and your profile will be created automatically.')
        return
      }

      // Create profile row in DB (id must match auth user id)
      const profile = {
        id: user.id,
        full_name: fullName,
        phone: phone,
        role: role
      }
      const { error: pErr } = await supabase.from('profiles').insert(profile)
      if (pErr) {
        // If profile exists or insertion failed, log and continue
        console.warn('Profile insert error', pErr.message)
      }

      // If user is a patient create a patients row if not exists
      if (role === 'patient') {
        const { data: existing } = await supabase.from('patients').select('id').eq('profile_id', user.id).limit(1).maybeSingle()
        if (!existing) {
          await supabase.from('patients').insert({ profile_id: user.id, name: fullName, phone })
        }
      }

      setMessage('Sign up complete — signed in')
      onUser(user)
    } catch (err) {
      setMessage(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button onClick={() => setMode('signin')} className={mode==='signin'?'active':''}>Sign in</button>
        <button onClick={() => setMode('signup')} className={mode==='signup'?'active':''}>Sign up</button>
      </div>

      <form onSubmit={mode==='signin' ? handleSignIn : handleSignUp}>
        <label style={{ display: 'block', marginBottom: 6 }}>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />

        <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

        {mode === 'signup' && (
          <>
            <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Full name</label>
            <input value={fullName} onChange={e=>setFullName(e.target.value)} required />

            <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Phone</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} />

            <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)}>
              <option value="patient">Patient</option>
              <option value="professional">Professional</option>
              <option value="supervisor">Supervisor</option>
              <option value="coordinator">Coordinator</option>
            </select>
          </>
        )}

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Please wait...' : (mode==='signin' ? 'Sign in' : 'Create account')}</button>
        </div>
      </form>

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  )
}
