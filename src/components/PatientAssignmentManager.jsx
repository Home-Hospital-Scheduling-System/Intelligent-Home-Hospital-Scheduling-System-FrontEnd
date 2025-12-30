import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import AssignPatient from './AssignPatient'
import { findBestMatches, autoAssignPatient, generateAssignmentSuggestions } from '../lib/aiAssignmentEngine'
import { findBestAssignmentWithTimeSlots, calculateAvailableTimeSlots } from '../lib/timeSlotOptimizer'

export default function PatientAssignmentManager({ profile }) {
  const [unassignedPatients, setUnassignedPatients] = useState([])
  const [assignedPatients, setAssignedPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [activeTab, setActiveTab] = useState('unassigned')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [allSpecializations, setAllSpecializations] = useState([])
  const [professionalsWithSkill, setProfessionalsWithSkill] = useState([])
  const [aiMatches, setAiMatches] = useState([])
  const [showAiMatches, setShowAiMatches] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [unassigning, setUnassigning] = useState(false)

  useEffect(() => {
    loadPatients()
    loadSpecializations()
  }, [])

  async function loadPatients() {
    try {
      setLoading(true)
      setError('')

      // Get all patients
      const { data: allPatients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (patientsError) throw patientsError

      // Get assigned patients
      const { data: assignments, error: assignmentsError } = await supabase
        .from('patient_assignments')
        .select('patient_id')
        .eq('status', 'active')

      if (assignmentsError) throw assignmentsError

      const assignedIds = new Set(assignments.map(a => a.patient_id))

      // Separate assigned and unassigned
      const unassigned = allPatients.filter(p => !assignedIds.has(p.id))
      const assigned = allPatients.filter(p => assignedIds.has(p.id))

      setUnassignedPatients(unassigned)
      setAssignedPatients(assigned)
    } catch (err) {
      setError('Failed to load patients: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadSpecializations() {
    try {
      const { data, error } = await supabase
        .from('professional_specializations')
        .select('specialization')
      
      if (error) {
        console.error('Error fetching specializations:', error)
        return
      }

      // Get unique specializations
      const uniqueSpecs = [...new Set(data?.map(s => s.specialization) || [])]
      setAllSpecializations(uniqueSpecs.sort())
    } catch (err) {
      console.error('Error in loadSpecializations:', err)
    }
  }

  async function loadProfessionalsWithSkill(skill) {
    if (!skill) {
      setProfessionalsWithSkill([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('professional_specializations')
        .select('professional_id, professionals(id, kind, specialty, profiles(full_name))')
        .eq('specialization', skill)

      if (error) {
        console.error('Error fetching professionals with skill:', error)
        return
      }

      setProfessionalsWithSkill(data || [])
    } catch (err) {
      console.error('Error in loadProfessionalsWithSkill:', err)
    }
  }

  function handleSkillFilterChange(skill) {
    if (filterSkill === skill) {
      setFilterSkill('')
      setProfessionalsWithSkill([])
    } else {
      setFilterSkill(skill)
      loadProfessionalsWithSkill(skill)
    }
  }

  // AI: Find best matches for selected patient
  async function handleAiMatches() {
    if (!selectedPatient) return
    
    try {
      setAiLoading(true)
      const result = await findBestAssignmentWithTimeSlots(selectedPatient.id)
      if (result.success) {
        setAiMatches(result.candidates)
        setShowAiMatches(true)
      } else {
        setError('No suitable professionals found: ' + result.error)
      }
    } catch (err) {
      setError('Failed to generate AI matches: ' + err.message)
    } finally {
      setAiLoading(false)
    }
  }

  // AI: Auto-assign the patient to best match
  async function handleAutoAssign(matchProfessionalId) {
    try {
      setAiLoading(true)
      const result = await autoAssignPatient(selectedPatient.id, profile.id)
      
      if (result.success) {
        setError('')
        loadPatients()
        setShowAssignForm(false)
        setShowAiMatches(false)
        setSelectedPatient(null)
        // Show success message with match details
        setTimeout(() => {
          const clusteringInfo = result.matchDetails.clusteringBonus > 0 
            ? `\n🗺️ Geographic Clustering: +${result.matchDetails.clusteringBonus} pts` 
            : ''
          alert(`✓ Patient assigned to ${result.matchDetails.professional}!\n\nMatch Score: ${result.matchDetails.finalScore}%\nSkill: ${result.matchDetails.skillMatch}% | Availability: ${result.matchDetails.availability}% | Location: ${result.matchDetails.areaMatch}%${clusteringInfo}\n\n${result.matchDetails.reasoning}`)
        }, 100)
      } else {
        setError('Failed to auto-assign: ' + result.message)
      }
    } catch (err) {
      setError('Error during auto-assignment: ' + err.message)
    } finally {
      setAiLoading(false)
    }
  }

  // AI: Bulk assign all unassigned patients
  async function handleBulkAutoAssign() {
    if (unassignedPatients.length === 0) {
      setError('No unassigned patients to auto-assign')
      return
    }

    if (!window.confirm(`Auto-assign all ${unassignedPatients.length} unassigned patients using AI?\n\nThis will match each patient to the best available professional based on skills, availability, and location.`)) {
      return
    }

    try {
      setAiLoading(true)
      setError('')
      
      let successCount = 0
      let failCount = 0
      const assignedInSession = [] // Track assignments made in this session
      
      for (const patient of unassignedPatients) {
        // Pass in-session assignments to avoid race conditions
        const result = await autoAssignPatient(patient.id, profile.id, assignedInSession)
        if (result.success) {
          successCount++
          // Add to session tracking
          if (result.assignment) {
            assignedInSession.push({
              id: result.assignment.id,
              professional_id: result.assignment.professional_id,
              scheduled_visit_date: result.assignment.scheduled_visit_date,
              scheduled_visit_time: result.assignment.scheduled_visit_time
            })
          }
        } else {
          failCount++
        }
      }
      
      loadPatients()
      alert(`✓ Bulk Assignment Complete!\n\nSuccessfully assigned: ${successCount}\nFailed: ${failCount}`)
    } catch (err) {
      setError('Error during bulk assignment: ' + err.message)
    } finally {
      setAiLoading(false)
    }
  }

  // Unassign a patient (move back to unassigned list)
  async function handleUnassignPatient(patientId, patientName) {
    if (!window.confirm(`Are you sure you want to unassign ${patientName}?\n\nThis will remove them from their assigned professional and make them available for reassignment.`)) {
      return
    }

    try {
      setUnassigning(true)
      setError('')

      // Delete the assignment
      const { error: deleteError } = await supabase
        .from('patient_assignments')
        .delete()
        .eq('patient_id', patientId)
        .eq('status', 'active')

      if (deleteError) throw deleteError

      // Reload patients to update lists
      await loadPatients()
      setError('')
      alert(`✓ ${patientName} has been unassigned and is now available for reassignment`)
    } catch (err) {
      setError('Failed to unassign patient: ' + err.message)
    } finally {
      setUnassigning(false)
    }
  }

  // Bulk unassign all assigned patients
  async function handleBulkUnassign() {
    if (assignedPatients.length === 0) {
      setError('No assigned patients to unassign')
      return
    }

    if (!window.confirm(`Unassign ALL ${assignedPatients.length} assigned patients?\n\nThis will make all of them available for reassignment. This action is reversible.`)) {
      return
    }

    try {
      setUnassigning(true)
      setError('')

      // Delete all assignments
      const { error: deleteError } = await supabase
        .from('patient_assignments')
        .delete()
        .eq('status', 'active')

      if (deleteError) throw deleteError

      // Reload patients
      await loadPatients()
      alert(`✓ All patients have been unassigned and are now available for reassignment`)
    } catch (err) {
      setError('Failed to unassign patients: ' + err.message)
    } finally {
      setUnassigning(false)
    }
  }

  function getFilteredPatients() {
    const patients = activeTab === 'unassigned' ? unassignedPatients : assignedPatients
    let filtered = patients
    
    if (filterArea) {
      filtered = filtered.filter(p => p.area === filterArea)
    }
    
    if (filterSkill) {
      // Filter patients whose care_needed matches the selected skill
      filtered = filtered.filter(p => p.care_needed === filterSkill)
    }
    
    return filtered
  }

  const filteredPatients = getFilteredPatients()
  const uniqueAreas = [...new Set([...unassignedPatients, ...assignedPatients].map(p => p.area))]

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#0c4a6e' }}>
        Loading patients...
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ color: '#0c4a6e', marginBottom: '2rem' }}>Patient Assignment Manager</h1>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          borderRadius: '6px',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => { setActiveTab('unassigned'); setFilterArea(''); setFilterSkill(''); setProfessionalsWithSkill([]) }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === 'unassigned' ? '#0ea5e9' : '#f1f5f9',
              color: activeTab === 'unassigned' ? 'white' : '#0c4a6e',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.95rem'
            }}
          >
            📋 Unassigned ({unassignedPatients.length})
          </button>
          <button
            onClick={() => { setActiveTab('assigned'); setFilterArea(''); setFilterSkill(''); setProfessionalsWithSkill([]) }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === 'assigned' ? '#0ea5e9' : '#f1f5f9',
              color: activeTab === 'assigned' ? 'white' : '#0c4a6e',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.95rem'
            }}
          >
            ✓ Assigned ({assignedPatients.length})
          </button>
        </div>

        {/* AI Bulk Assign Button */}
        {activeTab === 'unassigned' && unassignedPatients.length > 0 && (
          <button
            onClick={handleBulkAutoAssign}
            disabled={aiLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: aiLoading ? '#cbd5e1' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: aiLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
          >
            🤖 {aiLoading ? 'Assigning...' : 'AI Bulk Assign All'}
          </button>
        )}

        {/* Bulk Unassign Button */}
        {activeTab === 'assigned' && assignedPatients.length > 0 && (
          <button
            onClick={handleBulkUnassign}
            disabled={unassigning}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: unassigning ? '#cbd5e1' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: unassigning ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
          >
            ↩️ {unassigning ? 'Unassigning...' : 'Bulk Unassign All'}
          </button>
        )}
      </div>

      {/* Area Filter */}
      {uniqueAreas.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Filter by Area
          </label>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.95rem',
              backgroundColor: 'white',
              color: '#0c4a6e',
              cursor: 'pointer',
              maxWidth: '300px'
            }}
          >
            <option value="">-- All Areas --</option>
            {uniqueAreas.sort().map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
      )}

      {/* Skill Filter - Filter by Professional Skills */}
      {allSpecializations.length > 0 && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#0c4a6e', fontSize: '1rem' }}>
            🎯 Filter Patients by Professional Skills
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Select a skill to see patients who need that type of care and professionals who can provide it
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {allSpecializations.map(skill => (
              <button
                key={skill}
                onClick={() => handleSkillFilterChange(skill)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: filterSkill === skill ? '#8b5cf6' : '#ede9fe',
                  color: filterSkill === skill ? 'white' : '#6b21a8',
                  border: '1px solid #8b5cf6',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                {skill}
              </button>
            ))}
          </div>

          {/* Show professionals with selected skill */}
          {filterSkill && professionalsWithSkill.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#faf5ff',
              borderRadius: '6px',
              border: '1px solid #c4b5fd'
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#6b21a8' }}>
                👨‍⚕️ Professionals with "{filterSkill}" skill ({professionalsWithSkill.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {professionalsWithSkill.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: 'white',
                      border: '1px solid #c4b5fd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      color: '#6b21a8'
                    }}
                  >
                    {item.professionals?.profiles?.full_name || 'Unknown'} 
                    <span style={{ color: '#a78bfa', marginLeft: '0.25rem' }}>
                      ({item.professionals?.kind})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {filterSkill && professionalsWithSkill.length === 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
              border: '1px solid #fcd34d',
              color: '#92400e'
            }}>
              ⚠️ No professionals found with "{filterSkill}" skill
            </div>
          )}

          {/* Clear filters button */}
          {(filterArea || filterSkill) && (
            <button
              onClick={() => {
                setFilterArea('')
                setFilterSkill('')
                setProfessionalsWithSkill([])
              }}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* AI Matches Modal */}
      {showAiMatches && selectedPatient && aiMatches.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#0c4a6e' }}>🤖 AI Match Results</h2>
              <button
                onClick={() => setShowAiMatches(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f3e8ff', borderRadius: '6px', border: '1px solid #c4b5fd' }}>
              <strong style={{ color: '#6b21a8' }}>Patient:</strong> {selectedPatient.name}
              <br />
              <strong style={{ color: '#6b21a8' }}>Care Needed:</strong> {selectedPatient.care_needed}
              <br />
              <strong style={{ color: '#6b21a8' }}>Area:</strong> {selectedPatient.area}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {aiMatches.map((match, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#f5f3ff',
                    borderRadius: '8px',
                    border: '2px solid #c4b5fd',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ede9fe'
                    e.currentTarget.style.borderColor = '#8b5cf6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f3ff'
                    e.currentTarget.style.borderColor = '#c4b5fd'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#6b21a8', fontSize: '1.1rem' }}>
                        {idx + 1}. {match.professional_name}
                      </h4>
                      <p style={{ margin: 0, color: '#9333ea', fontSize: '0.9rem' }}>
                        {match.kind === 'doctor' ? '👨‍⚕️ Doctor' : '👩‍⚕️ Nurse'} • {match.specialty}
                      </p>
                    </div>
                  </div>

                  {/* Available Slots */}
                  {match.available_slots && match.available_slots.length > 0 && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e9d5ff' }}>
                      <div style={{ color: '#6b21a8', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        📅 Available Time Slots:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {match.available_slots.slice(0, 3).map((slot, slotIdx) => (
                          <div
                            key={slotIdx}
                            style={{
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#f3e8ff',
                              border: '1px solid #c4b5fd',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              color: '#6b21a8',
                              fontWeight: '500'
                            }}
                          >
                            {new Date(slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {slot.time}
                          </div>
                        ))}
                        {match.available_slots.length > 3 && (
                          <div style={{
                            padding: '0.5rem 0.75rem',
                            color: '#6b21a8',
                            fontSize: '0.8rem'
                          }}>
                            +{match.available_slots.length - 3} more slots
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleAutoAssign(match.professional_id)}
                    disabled={aiLoading}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: aiLoading ? '#cbd5e1' : '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    {aiLoading ? '⏳ Assigning...' : '✓ Assign This Professional'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignForm && selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#0c4a6e' }}>Assign Patient</h2>
              <button
                onClick={() => setShowAssignForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            {/* AI Suggestions Button */}
            <button
              onClick={handleAiMatches}
              disabled={aiLoading}
              style={{
                width: '100%',
                padding: '1rem',
                marginBottom: '1.5rem',
                backgroundColor: aiLoading ? '#cbd5e1' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => !aiLoading && (e.currentTarget.style.backgroundColor = '#7c3aed')}
              onMouseLeave={(e) => !aiLoading && (e.currentTarget.style.backgroundColor = '#8b5cf6')}
            >
              🤖 {aiLoading ? 'Finding Best Matches...' : 'Get AI Recommendations'}
            </button>

            <div style={{ borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', paddingBottom: '1rem', textAlign: 'center', color: '#64748b' }}>
              OR manually assign below
            </div>

            <AssignPatient
              patientId={selectedPatient.id}
              onAssigned={() => {
                loadPatients()
                setShowAssignForm(false)
              }}
              onClose={() => setShowAssignForm(false)}
            />
          </div>
        </div>
      )}

      {/* Patients List */}
      <div>
        <h2 style={{ color: '#0c4a6e', marginBottom: '1rem' }}>
          {activeTab === 'unassigned' ? 'Unassigned Patients' : 'Assigned Patients'}
        </h2>

        {filteredPatients.length === 0 ? (
          <div style={{
            padding: '2rem',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #0ea5e9',
            color: '#0c4a6e',
            textAlign: 'center'
          }}>
            <p>No {activeTab === 'unassigned' ? 'unassigned' : 'assigned'} patients {filterArea ? `in ${filterArea}` : ''}.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredPatients.map(patient => (
              <div
                key={patient.id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: activeTab === 'unassigned' ? '#fef3c7' : '#f0fdf4',
                  border: activeTab === 'unassigned' ? '1px solid #fbbf24' : '1px solid #86efac',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>👤 {patient.name}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>📍 Area:</span> <strong>{patient.area}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>📞 Phone:</span> <strong>{patient.phone}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>🏥 Care:</span> <strong>{patient.care_needed}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>📍 Address:</span> <strong>{patient.address}</strong>
                    </div>
                  </div>
                </div>

                {activeTab === 'unassigned' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleAutoAssign(patient.id)}
                      disabled={aiLoading}
                      style={{
                        padding: '0.6rem 1.2rem',
                        backgroundColor: aiLoading ? '#cbd5e1' : '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: aiLoading ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                      title="AI will find the best professional for this patient"
                    >
                      🤖 Quick AI Assign
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatient(patient)
                        setShowAssignForm(true)
                      }}
                      style={{
                        padding: '0.6rem 1.2rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap'
                      }}
                      title="Manually select a professional"
                    >
                      Manual Assign
                    </button>
                  </div>
                )}

                {activeTab === 'assigned' && (
                  <button
                    onClick={() => handleUnassignPatient(patient.id, patient.name)}
                    disabled={unassigning}
                    style={{
                      padding: '0.6rem 1.2rem',
                      backgroundColor: unassigning ? '#cbd5e1' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: unassigning ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                    title="Remove this patient from assignment and make available for reassignment"
                  >
                    ↩️ Unassign
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
