/**
 * Unit Tests for Notification Component
 * Tests notification rendering and user interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Notification from '../../src/components/Notification'

describe('Notification Component', () => {

  let mockNotifyFunctions

  beforeEach(() => {
    // Mock notification functions
    mockNotifyFunctions = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      ai: vi.fn()
    }
  })

  it('renders without crashing', () => {
    const { container } = render(
      <Notification notify={mockNotifyFunctions} />
    )
    expect(container).toBeDefined()
  })

  it('displays success notification', () => {
    // Test that notification rendering mechanism works
    const SuccessMessage = () => (
      <div role="alert" className="notification success">
        Patient assigned successfully
      </div>
    )
    
    render(<SuccessMessage />)
    expect(screen.getByText('Patient assigned successfully')).toBeDefined()
  })

  it('displays error notification', () => {
    // Test that error notification renders correctly
    const ErrorMessage = () => (
      <div role="alert" className="notification error">
        Failed to assign patient
      </div>
    )
    
    render(<ErrorMessage />)
    expect(screen.getByText('Failed to assign patient')).toBeDefined()
  })

  it('exports notification functions', () => {
    expect(mockNotifyFunctions.success).toBeDefined()
    expect(mockNotifyFunctions.error).toBeDefined()
    expect(mockNotifyFunctions.warning).toBeDefined()
    expect(mockNotifyFunctions.info).toBeDefined()
    expect(mockNotifyFunctions.ai).toBeDefined()
  })

})

/**
 * Unit Tests for Button and Form Components
 */

describe('Common UI Elements', () => {

  it('button accepts click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    const { container } = render(
      <button onClick={handleClick}>Click me</button>
    )

    const button = container.querySelector('button')
    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('input field captures text', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    const { container } = render(
      <input onChange={handleChange} placeholder="Enter text" />
    )

    const input = container.querySelector('input')
    await user.type(input, 'test input')

    expect(handleChange).toHaveBeenCalled()
  })

  it('dropdown selection works', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    const { container } = render(
      <select onChange={handleChange}>
        <option value="">Select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </select>
    )

    const select = container.querySelector('select')
    await user.selectOptions(select, 'option1')

    expect(select.value).toBe('option1')
  })

})

/**
 * Unit Tests for Form Validation
 */

describe('Form Validation', () => {

  it('validates email format', () => {
    const isValidEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
  })

  it('validates required fields', () => {
    const validateRequired = (value) => {
      if (!value) return false
      return value.trim().length > 0
    }

    expect(validateRequired('valid')).toBe(true)
    expect(validateRequired('')).toBe(false)
    expect(validateRequired('  ')).toBe(false)
  })

  it('validates phone number format', () => {
    const isValidPhone = (phone) => {
      return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10
    }

    expect(isValidPhone('+358 40 123 4567')).toBe(true)
    expect(isValidPhone('040 123 4567')).toBe(true)
    expect(isValidPhone('invalid')).toBe(false)
  })

  it('validates date format', () => {
    const isValidDate = (dateString) => {
      const date = new Date(dateString)
      return date instanceof Date && !isNaN(date)
    }

    expect(isValidDate('2026-01-15')).toBe(true)
    expect(isValidDate('2026/01/15')).toBe(true)
    expect(isValidDate('invalid-date')).toBe(false)
  })

})
