import React from 'react'
import CoordinatorSchedules from './components/CoordinatorSchedules'

export default function App() {
  return (
    <div className="app-container">
      <main className="hero">
        <h1>AI Powered Home Hospital Scheduling System</h1>
  <p className="lead">Coordinator view — upcoming visits are shown below.</p>
  <CoordinatorSchedules />
      </main>
    </div>
  )
}
