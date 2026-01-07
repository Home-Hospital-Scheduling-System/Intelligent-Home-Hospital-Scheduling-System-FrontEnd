#!/usr/bin/env node
/**
 * Test script to diagnose Supabase authentication issues
 * Run: node scripts/test_auth.js
 */

const fs = require('fs')
const path = require('path')

// Load .env file
const envPath = path.join(__dirname, '../.env')
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at', envPath)
  console.log('📝 Copy .env.example to .env and fill in your Supabase credentials')
  process.exit(1)
}

const env = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(line => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=')
    let value = val.join('=').trim()
    // Remove surrounding quotes if present
    value = value.replace(/^["']|["']$/g, '')
    acc[key.trim()] = value
    return acc
  }, {})

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

console.log('🔍 Testing Supabase Authentication Configuration\n')
console.log('URL:', SUPABASE_URL)
console.log('Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n')

// Fetch auth settings
fetch(`${SUPABASE_URL}/auth/v1/settings`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Auth Settings Retrieved:\n')
    
    if (data.external) {
      console.log('External Providers:')
      Object.entries(data.external).forEach(([provider, enabled]) => {
        console.log(`  ${provider}: ${enabled ? '✅ Enabled' : '❌ Disabled'}`)
      })
    }
    
    console.log('\nEmail Configuration:')
    if (data.mailer_autoconfirm !== undefined) {
      const isAutoConfirm = data.mailer_autoconfirm === true
      console.log(`  Auto-confirm emails: ${isAutoConfirm ? '✅ Enabled (emails auto-confirmed)' : '❌ Disabled (users must confirm)'}`)
    }
    
    console.log('\n📋 Diagnosis:')
    if (data.mailer_autoconfirm === false) {
      console.log('⚠️  EMAIL CONFIRMATION IS REQUIRED')
      console.log('   Users must confirm their email before signing in.')
      console.log('   After signup, check for a confirmation email.')
      console.log('\n   To DISABLE email confirmation:')
      console.log('   1. Go to Supabase Dashboard → Authentication → Providers')
      console.log('   2. Find the Email provider')
      console.log('   3. Toggle OFF "Confirm email"')
    } else if (data.mailer_autoconfirm === true) {
      console.log('✅ Email auto-confirmation is ENABLED')
      console.log('   Users can sign in immediately after signup without email confirmation.')
      console.log('\n   If you still get "Invalid login credentials", check:')
      console.log('   1. Email address is spelled correctly')
      console.log('   2. Password is correct (case-sensitive)')
      console.log('   3. Account exists in Supabase Auth (check Dashboard → Authentication → Users)')
    }
  })
  .catch(err => {
    console.error('❌ Failed to fetch auth settings:', err.message)
    console.log('\n💡 Alternative troubleshooting:')
    console.log('   1. Check that VITE_SUPABASE_URL is correct')
    console.log('   2. Check that VITE_SUPABASE_ANON_KEY is correct')
    console.log('   3. Verify your Supabase project is running')
  })
