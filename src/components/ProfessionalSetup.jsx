import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AVAILABLE_SPECIALIZATIONS = [
  'Wound Care',
  'Nursing Care',
  'Physical Therapy',
  'Rehabilitation',
  'Medication Management',
  'Home Health',
  'Elderly Care',
  'Speech Therapy',
  'Respiratory Care',
  'Occupational Therapy',
  'Palliative Care',
  'Post-operative Care',
  'Chronic Disease Management',
  'Cardiovascular Assessment',
  'Diabetic Care',
  'Acute Care'
]

const OULU_AREAS = [
  'Keskusta (City Center)',
  'Karjaa',
  'Kaituri',
  'Kaakkuri',
  'Kaulakeidas',
  'Kipinä',
  'Kontinkangas',
  'Kontioniemi',
  'Koskenkorva',
  'Kuivasjärvi',
  'Kurila',
  'Kylmäkoski',
  'Löytönen',
  'Maakari',
  'Meri-Oulu',
  'Metso',
  'Myllyoja',
  'Nakkila',
  'Nokkakivi',
  'Oikari',
  'Oinava',
  'Pajuniemi',
  'Pateniemi',
  'Pikisaari',
  'Pohjois-Oulu',
  'Raksila',
  'Rajakari',
  'Ravantti',
  'Rikkavesi',
  'Rusko',
  'Saarinen',
  'Salmirinne',
  'Saloinen',
  'Sarakyla',
  'Satakari',
  'Semperi',
  'Sipilä',
  'Sulkava',
  'Suvela',
  'Tuira',
  'Tuorinoja',
  'Uimahalli',
  'Valiokylä',
  'Välikylä',
  'Vapaala',
  'Värttiö',
  'Ylikiiminki',
  'Zollitsch',
  'Other'
]

export default function ProfessionalSetup({ professionalId, onClose }) {
  const [specializations, setSpecializations] = useState([])
  const [serviceAreas, setServiceAreas] = useState([])
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [isPrimaryArea, setIsPrimaryArea] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSpecializationsAndAreas()
  }, [professionalId])

  async function loadSpecializationsAndAreas() {
    try {
      setLoading(true)
      setError('')

      // Load specializations
      const { data: specs, error: specsError } = await supabase
        .from('professional_specializations')
        .select('*')
        .eq('professional_id', professionalId)

      if (specsError) throw specsError
      setSpecializations(specs || [])

      // Load service areas
      const { data: areas, error: areasError } = await supabase
        .from('professional_service_areas')
        .select('*')
        .eq('professional_id', professionalId)

      if (areasError) throw areasError
      setServiceAreas(areas || [])
    } catch (err) {
      setError('Failed to load professional setup: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSpecialization() {
    if (!selectedSpecialization) return

    try {
      setSaving(true)
      setError('')

      const { error: insertError } = await supabase
        .from('professional_specializations')
        .insert({
          professional_id: professionalId,
          specialization: selectedSpecialization,
          certification_date: new Date().toISOString()
        })

      if (insertError) throw insertError

      setSuccess('Specialization added!')
      await loadSpecializationsAndAreas()
      setSelectedSpecialization('')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Failed to add specialization: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddServiceArea() {
    if (!selectedArea) return

    try {
      setSaving(true)
      setError('')

      const { error: insertError } = await supabase
        .from('professional_service_areas')
        .insert({
          professional_id: professionalId,
          service_area: selectedArea,
          is_primary: isPrimaryArea
        })

      if (insertError) throw insertError

      setSuccess('Service area added!')
      await loadSpecializationsAndAreas()
      setSelectedArea('')
      setIsPrimaryArea(false)
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Failed to add service area: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveSpecialization(specId) {
    try {
      const { error: deleteError } = await supabase
        .from('professional_specializations')
        .delete()
        .eq('id', specId)

      if (deleteError) throw deleteError

      await loadSpecializationsAndAreas()
      setSuccess('Specialization removed!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Failed to remove specialization: ' + err.message)
    }
  }

  async function handleRemoveServiceArea(areaId) {
    try {
      const { error: deleteError } = await supabase
        .from('professional_service_areas')
        .delete()
        .eq('id', areaId)

      if (deleteError) throw deleteError

      await loadSpecializationsAndAreas()
      setSuccess('Service area removed!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Failed to remove service area: ' + err.message)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#0c4a6e' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      <h2 style={{ color: '#0c4a6e', marginTop: 0 }}>Professional Setup</h2>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          borderRadius: '6px',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#dcfce7',
          borderRadius: '6px',
          border: '1px solid #86efac',
          color: '#166534',
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          ✓ {success}
        </div>
      )}

      {/* Specializations Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#0c4a6e', marginBottom: '1rem' }}>🎓 Specializations</h3>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.95rem',
                backgroundColor: 'white',
                color: '#0c4a6e',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Select Specialization --</option>
              {AVAILABLE_SPECIALIZATIONS.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            <button
              onClick={handleAddSpecialization}
              disabled={!selectedSpecialization || saving}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: selectedSpecialization && !saving ? '#10b981' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedSpecialization && !saving ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                fontSize: '0.95rem'
              }}
            >
              Add
            </button>
          </div>

          {specializations.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No specializations added yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {specializations.map(spec => (
                <div
                  key={spec.id}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ color: '#0c4a6e', fontWeight: '500' }}>✓ {spec.specialization}</span>
                  <button
                    onClick={() => handleRemoveSpecialization(spec.id)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      border: '1px solid #fca5a5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service Areas Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#0c4a6e', marginBottom: '1rem' }}>📍 Service Areas</h3>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.95rem',
                backgroundColor: 'white',
                color: '#0c4a6e',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Select Service Area --</option>
              {OULU_AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <button
              onClick={handleAddServiceArea}
              disabled={!selectedArea || saving}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: selectedArea && !saving ? '#10b981' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedArea && !saving ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                fontSize: '0.95rem'
              }}
            >
              Add
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              checked={isPrimaryArea}
              onChange={(e) => setIsPrimaryArea(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Mark as primary service area
          </label>

          {serviceAreas.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No service areas added yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {serviceAreas.map(area => (
                <div
                  key={area.id}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: area.is_primary ? '#dbeafe' : '#f0f9ff',
                    border: area.is_primary ? '1px solid #0ea5e9' : '1px solid #bfdbfe',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ color: '#0c4a6e', fontWeight: '500' }}>
                      {area.is_primary ? '⭐' : '📍'} {area.service_area}
                    </span>
                    {area.is_primary && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#0ea5e9', fontWeight: '500' }}>
                        (Primary)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveServiceArea(area.id)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      border: '1px solid #fca5a5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Close Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f1f5f9',
            color: '#0c4a6e',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
