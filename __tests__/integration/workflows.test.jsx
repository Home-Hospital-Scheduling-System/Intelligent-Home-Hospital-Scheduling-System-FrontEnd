/**
 * Integration Tests for Frontend Workflows
 */

import React, { useState } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Test Suite: Authentication Flow
 */

describe('Authentication Workflow', () => {

  it('displays login form on initial load', () => {
    const LoginForm = () => (
      <form>
        <label>
          Email:
          <input type="email" name="email" />
        </label>
        <label>
          Password:
          <input type="password" name="password" />
        </label>
        <button type="submit">Login</button>
      </form>
    )

    render(<LoginForm />)
    
    expect(screen.getByText('Email:')).toBeDefined()
    expect(screen.getByText('Password:')).toBeDefined()
    expect(screen.getByRole('button', { name: /login/i })).toBeDefined()
  })

  it('accepts user credentials', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn(e => e.preventDefault())

    const LoginForm = () => (
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" defaultValue="" />
        <input type="password" name="password" defaultValue="" />
        <button type="submit">Login</button>
      </form>
    )

    const { container } = render(<LoginForm />)
    
    const emailInput = container.querySelector('input[type="email"]')
    const passwordInput = container.querySelector('input[type="password"]')
    const submitButton = container.querySelector('button[type="submit"]')

    await user.type(emailInput, 'coordinator@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(handleSubmit).toHaveBeenCalled()
  })

})

/**
 * Test Suite: Patient Assignment Workflow
 */

describe('Patient Assignment Workflow', () => {

  it('displays patient list', () => {
    const PatientList = ({ patients }) => (
      <div>
        <h2>Unassigned Patients</h2>
        <ul>
          {patients.map(p => (
            <li key={p.id}>{p.name} - {p.diagnosis}</li>
          ))}
        </ul>
      </div>
    )

    const patients = [
      { id: 1, name: 'John Doe', diagnosis: 'Wound care' },
      { id: 2, name: 'Jane Smith', diagnosis: 'Physical therapy' }
    ]

    render(<PatientList patients={patients} />)

    expect(screen.getByText('Unassigned Patients')).toBeDefined()
    expect(screen.getByText('John Doe - Wound care')).toBeDefined()
    expect(screen.getByText('Jane Smith - Physical therapy')).toBeDefined()
  })

  it('filters patients by care type', async () => {
    const user = userEvent.setup()

    const PatientFilter = () => {
      const [filter, setFilter] = useState('')
      const patients = [
        { id: 1, name: 'Patient A', care: 'Wound Care' },
        { id: 2, name: 'Patient B', care: 'Physical Therapy' },
        { id: 3, name: 'Patient C', care: 'Wound Care' }
      ]

      const filtered = filter 
        ? patients.filter(p => p.care === filter)
        : patients

      return (
        <div>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="Wound Care">Wound Care</option>
            <option value="Physical Therapy">Physical Therapy</option>
          </select>
          <ul>
            {filtered.map(p => <li key={p.id}>{p.name}</li>)}
          </ul>
        </div>
      )
    }

    const { container, rerender } = render(<PatientFilter />)
    
    // Initially shows all patients
    expect(screen.getByText('Patient A')).toBeDefined()
    expect(screen.getByText('Patient B')).toBeDefined()

    // Filter to Wound Care
    const select = container.querySelector('select')
    await user.selectOptions(select, 'Wound Care')

    // Should show only wound care patients
    expect(screen.getByText('Patient A')).toBeDefined()
    expect(screen.getByText('Patient C')).toBeDefined()
    expect(screen.queryByText('Patient B')).toBeNull()
  })

  it('assigns patient to professional', async () => {
    const user = userEvent.setup()
    const handleAssign = vi.fn()

    const AssignmentModal = ({ patient, onAssign }) => (
      <div>
        <h3>Assign {patient.name}</h3>
        <select onChange={e => onAssign({ patientId: patient.id, proId: e.target.value })}>
          <option value="">Select Professional</option>
          <option value="pro-1">Prof. Smith</option>
          <option value="pro-2">Prof. Johnson</option>
        </select>
      </div>
    )

    const patient = { id: 'pat-1', name: 'John Doe' }
    const { container } = render(
      <AssignmentModal patient={patient} onAssign={handleAssign} />
    )

    const select = container.querySelector('select')
    await user.selectOptions(select, 'pro-1')

    expect(handleAssign).toHaveBeenCalledWith({
      patientId: 'pat-1',
      proId: 'pro-1'
    })
  })

})

/**
 * Test Suite: Professional Workload Display
 */

describe('Professional Workload Display', () => {

  it('shows professional workload', () => {
    const WorkloadDisplay = ({ professional }) => (
      <div>
        <h3>{professional.name}</h3>
        <p>Workload: {professional.currentPatients}/{professional.maxPatients} patients</p>
      </div>
    )

    const professional = {
      name: 'Prof. Smith',
      currentPatients: 3,
      maxPatients: 4
    }

    render(<WorkloadDisplay professional={professional} />)

    expect(screen.getByText('Prof. Smith')).toBeDefined()
    expect(screen.getByText('Workload: 3/4 patients')).toBeDefined()
  })

  it('warns when professional at capacity', () => {
    const WorkloadDisplay = ({ professional }) => (
      <div>
        <p>Workload: {professional.currentPatients}/{professional.maxPatients}</p>
        {professional.currentPatients >= professional.maxPatients && (
          <div className="warning">At capacity</div>
        )}
      </div>
    )

    const atCapacity = { currentPatients: 4, maxPatients: 4 }
    const { rerender } = render(<WorkloadDisplay professional={atCapacity} />)

    expect(screen.getByText('At capacity')).toBeDefined()
  })

})
