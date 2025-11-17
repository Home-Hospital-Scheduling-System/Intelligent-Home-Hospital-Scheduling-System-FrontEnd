import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import CoordinatorSchedules from './components/CoordinatorSchedules'
import PatientView from './components/PatientView'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setSession(data.session ?? null)
      if (data.session?.user) await loadProfile(data.session.user)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess?.session ?? null)
      if (sess?.session?.user) loadProfile(sess.session.user)
      else setProfile(null)
    })
    return () => listener?.subscription?.unsubscribe && listener.subscription.unsubscribe()
  }, [])

  async function loadProfile(user) {
    if (!user) return
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).limit(1).single()
      if (error || !data) {
        // no profile yet — check if we have pending signup info in localStorage (email-keyed)
        try {
          const pendingRaw = localStorage.getItem('hhss_pending_profile_' + (user.email || ''))
          if (pendingRaw) {
            const pending = JSON.parse(pendingRaw)
            const profile = { id: user.id, full_name: pending.fullName, phone: pending.phone, role: pending.role }
            const { error: pErr } = await supabase.from('profiles').insert(profile)
            if (!pErr) {
              // create patient row when role=patient
              if (pending.role === 'patient') {
                await supabase.from('patients').insert({ profile_id: user.id, name: pending.fullName, phone: pending.phone })
              }
              localStorage.removeItem('hhss_pending_profile_' + (user.email || ''))
              setProfile(profile)
              return
            }
          }
        } catch (e) {
          console.warn('error creating pending profile', e)
        }
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (e) {
      setProfile(null)
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('sign out error', e)
    } finally {
      setSession(null)
      setProfile(null)
    }
  }

  return (
    <div className="app-container">
      <main className="hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1>AI Powered Home Hospital Scheduling System</h1>
          {session && (
            <button onClick={handleSignOut} style={{ marginLeft: 12 }}>Sign out</button>
          )}
        </div>

        {!session && (
          <>
            <p className="lead">Welcome — manage home and clinic visits with AI-assisted scheduling. Sign in or create an account to continue.</p>
            <Auth onUser={(u)=>{ if(u) loadProfile(u); else setProfile(null); setSession(u?{user:u}:null) }} />
          </>
        )}

        {session && profile && profile.role === 'coordinator' && (
          <>
            <p className="lead">Coordinator view — upcoming visits are shown below.</p>
            <CoordinatorSchedules />
          </>
        )}

        {session && profile && profile.role === 'patient' && (
          <>
            <p className="lead">Patient dashboard</p>
            <PatientView profile={profile} />
          </>
        )}

        {session && profile && ['professional','supervisor'].includes(profile.role) && (
          <>
            <p className="lead">Sample page for {profile.role} — we'll add a dedicated view later.</p>
            <CoordinatorSchedules />
          </>
        )}
      </main>
    </div>
  )
}
