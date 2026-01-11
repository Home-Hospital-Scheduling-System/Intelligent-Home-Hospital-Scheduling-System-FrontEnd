/**
 * Vitest Setup File for React Testing Library
 */

import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock Supabase environment variables
process.env.VITE_SUPABASE_URL = 'https://mock.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'mock-anon-key'
process.env.VITE_API_BASE_URL = 'http://localhost:3001'
