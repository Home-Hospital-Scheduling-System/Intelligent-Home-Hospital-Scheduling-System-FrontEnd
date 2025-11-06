import React from 'react'
import PatientsList from './components/PatientsList'

export default function App() {
  return (
    <div className="app-container">
      <main className="hero">
        <h1>AI Powered Home Hospital Scheduling System</h1>
        <p className="lead">Welcome — this is the landing page. We'll add authentication, Supabase and features next.</p>
        <PatientsList />
      </main>
    </div>
  )
}
