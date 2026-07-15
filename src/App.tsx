import { useState } from 'react'
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Download, 
  Copy, 
  ShieldAlert, 
  Trash2, 
  Plus, 
  RefreshCw,
  Layers,
  FileText,
  AlertTriangle
} from 'lucide-react'

// Interfaces
interface Story {
  id: string
  title: string
  asA: string
  iWantTo: string
  soThat: string
  acceptanceCriteria: string[]
}

interface Vulnerability {
  title: string
  description: string
  acceptanceCriteria: string[]
}

interface Template {
  name: string
  text: string
}

// Templates to help POs get started
const TEMPLATES: Template[] = [
  {
    name: "User Filter Chips",
    text: `As a developer, I want a reusable Filter Chip component in our UI.
Stakeholders want it to look like modern chip filters (pill-shaped, outline/filled states).
It needs to support single-select and multi-select modes.
Filters should update the URL search query parameters dynamically so users can bookmark filtered views.
It must handle long category text gracefully (truncation) and be keyboard accessible.`
  },
  {
    name: "Double Submit Protection",
    text: `PO Request: Build double submit prevention for checkout.
We are seeing duplicate charge records in DB.
Frontend needs to disable the checkout submit button instantly upon click.
Show a loading spinner.
Handle cases where the checkout fails and let the user submit again.
We must support slow 3G connections (sometimes requests take up to 30s).`
  }
]

export default function App() {
  const [step, setStep] = useState<number>(1)
  const [rawNotes, setRawNotes] = useState<string>('')
  
  // Excavation states
  const [isExcavating, setIsExcavating] = useState<boolean>(false)
  const [excavatedSpec, setExcavatedSpec] = useState<string>('')
  const [excavateError, setExcavateError] = useState<string>('')

  // Slicing states
  const [isSlicing, setIsSlicing] = useState<boolean>(false)
  const [stories, setStories] = useState<Story[]>([])
  const [sliceError, setSliceError] = useState<string>('')
  
  // Adversary Auditing states
  const [auditingIndex, setAuditingIndex] = useState<number | null>(null)
  const [isAuditing, setIsAuditing] = useState<boolean>(false)
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [selectedVulnIndices, setSelectedVulnIndices] = useState<number[]>([])
  const [adversaryError, setAdversaryError] = useState<string>('')
  
  // Clipboard alert
  const [copied, setCopied] = useState<boolean>(false)

  // API Call handlers
  const handleExcavate = async () => {
    if (!rawNotes.trim()) return
    setIsExcavating(true)
    setExcavateError('')
    try {
      const response = await fetch('/api/excavate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rawNotes })
      })
      const data = await response.json()
      if (response.ok) {
        setExcavatedSpec(data.result)
        setStep(2) // Automatically transition to slicing step
      } else {
        setExcavateError(data.error || 'Excavation failed')
      }
    } catch (err: any) {
      setExcavateError(err.message || 'Connection error')
    } finally {
      setIsExcavating(false)
    }
  }

  const handleSlice = async () => {
    if (!excavatedSpec.trim()) return
    setIsSlicing(true)
    setSliceError('')
    try {
      const response = await fetch('/api/slice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: excavatedSpec })
      })
      const data = await response.json()
      if (response.ok) {
        // Normalize acceptanceCriteria from string/array to guaranteed array
        const normalized = (data.stories || []).map((story: any) => {
          let ac = story.acceptanceCriteria || []
          if (typeof ac === 'string') {
            ac = ac.split(/\n|(?=Given )|(?=When )|(?=Then )/i)
                   .map(line => line.trim())
                   .filter(line => line.length > 0)
          }
          return {
            id: story.id || `story-${Math.random().toString(36).substr(2, 9)}`,
            title: story.title || 'Untitled Story',
            asA: story.asA || '',
            iWantTo: story.iWantTo || '',
            soThat: story.soThat || '',
            acceptanceCriteria: ac
          } as Story
        })
        setStories(normalized)
      } else if (response.status === 422 && data.rawResult) {
        setSliceError(`The Slicer Agent returned unparseable text. Click 'Retry' or edit raw specs.`)
        console.warn('Raw unparseable result:', data.rawResult)
      } else {
        setSliceError(data.error || 'Slicing failed')
      }
    } catch (err: any) {
      setSliceError(err.message || 'Connection error')
    } finally {
      setIsSlicing(false)
    }
  }

  const startAdversaryAudit = async (index: number) => {
    setAuditingIndex(index)
    setIsAuditing(true)
    setSelectedVulnIndices([])
    setAdversaryError('')
    try {
      const response = await fetch('/api/adversary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: stories[index] })
      })
      const data = await response.json()
      if (response.ok) {
        const normalized = (data.edgeCases || []).map((vuln: any) => {
          let ac = vuln.acceptanceCriteria || []
          if (typeof ac === 'string') {
            ac = ac.split(/\n|(?=Given )|(?=When )|(?=Then )/i)
                   .map(line => line.trim())
                   .filter(line => line.length > 0)
          }
          return {
            title: vuln.title || 'Untitled Edgecase',
            description: vuln.description || '',
            acceptanceCriteria: ac
          } as Vulnerability
        })
        setVulnerabilities(normalized)
      } else {
        setAdversaryError(data.error || 'Audit failed')
      }
    } catch (err: any) {
      setAdversaryError(err.message || 'Connection error')
    } finally {
      setIsAuditing(false)
    }
  }

  const applyVulnerabilities = () => {
    if (auditingIndex === null) return
    const updatedStories = [...stories]
    const story = updatedStories[auditingIndex]
    
    const newCriteria = [...(story.acceptanceCriteria || [])]
    selectedVulnIndices.forEach(idx => {
      const vuln = vulnerabilities[idx]
      newCriteria.push(`Given edgecase '${vuln.title}' (${vuln.description})`)
      vuln.acceptanceCriteria.forEach(ac => {
        newCriteria.push(ac)
      })
    })
    
    story.acceptanceCriteria = newCriteria
    setStories(updatedStories)
    closeAdversaryModal()
  }

  const closeAdversaryModal = () => {
    setAuditingIndex(null)
    setVulnerabilities([])
    setSelectedVulnIndices([])
  }

  const handleUpdateStoryField = (index: number, field: keyof Story, value: string) => {
    const updated = [...stories]
    if (field === 'acceptanceCriteria') return // Managed separately
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    setStories(updated)
  }

  const handleUpdateStoryAC = (storyIndex: number, acIndex: number, value: string) => {
    const updated = [...stories]
    const updatedAc = [...updated[storyIndex].acceptanceCriteria]
    updatedAc[acIndex] = value
    updated[storyIndex] = {
      ...updated[storyIndex],
      acceptanceCriteria: updatedAc
    }
    setStories(updated)
  }

  const handleAddAC = (storyIndex: number) => {
    const updated = [...stories]
    const updatedAc = [...(updated[storyIndex].acceptanceCriteria || [])]
    updatedAc.push('Given... When... Then...')
    updated[storyIndex] = {
      ...updated[storyIndex],
      acceptanceCriteria: updatedAc
    }
    setStories(updated)
  }

  const handleDeleteAC = (storyIndex: number, acIndex: number) => {
    const updated = [...stories]
    const updatedAc = [...updated[storyIndex].acceptanceCriteria]
    updatedAc.splice(acIndex, 1)
    updated[storyIndex] = {
      ...updated[storyIndex],
      acceptanceCriteria: updatedAc
    }
    setStories(updated)
  }

  const handleAddStory = () => {
    const newStory: Story = {
      id: `story-custom-${Date.now()}`,
      title: 'New Story Slice',
      asA: 'User',
      iWantTo: 'perform action',
      soThat: 'benefit',
      acceptanceCriteria: ['Given... When... Then...']
    }
    setStories([...stories, newStory])
  }

  const handleDeleteStory = (index: number) => {
    const updated = [...stories]
    updated.splice(index, 1)
    setStories(updated)
  }

  // Compile backlog to markdown
  const generateMarkdownBacklog = () => {
    let md = `# Refined Backlog: AI Refinement Matrix\n\n`
    
    if (excavatedSpec) {
      md += `## 1. Core Architectural & Requirement Analysis (The Excavator)\n\n`
      md += `${excavatedSpec}\n\n`
    }
    
    md += `## 2. Refined Vertical User Stories (The Slicer & Adversary)\n\n`
    if (stories.length === 0) {
      md += `*No user stories generated yet.*\n`
    } else {
      stories.forEach((story, idx) => {
        md += `### Slice ${idx + 1}: ${story.title}\n\n`
        md += `**Role:** As a ${story.asA}\n`
        md += `**Action:** I want to ${story.iWantTo}\n`
        md += `**Value:** So that ${story.soThat}\n\n`
        md += `#### Acceptance Criteria:\n`
        if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
          story.acceptanceCriteria.forEach(ac => {
            md += `- ${ac}\n`
          })
        } else {
          md += `*No acceptance criteria specified.*\n`
        }
        md += `\n---\n\n`
      })
    }
    return md
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMarkdownBacklog())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadMarkdownFile = () => {
    const md = generateMarkdownBacklog()
    const element = document.createElement("a")
    const file = new Blob([md], {type: 'text/markdown'})
    element.href = URL.createObjectURL(file)
    element.download = "refined-backlog.md"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <h1 className="app-title">AI Refinement Matrix</h1>
        <p className="app-subtitle">
          Super-focusing on backlog refinement & slicing. Mine raw inputs, slice them into vertical user stories, and stress-test them for edge cases.
        </p>
      </header>

      {/* Stepper HUD */}
      <div className="pipeline-steps">
        <div 
          className={`step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
          onClick={() => setStep(1)}
        >
          <div className="step-number">1</div>
          <span className="step-label">Excavate Specs</span>
        </div>
        <div className="step-arrow"><ArrowRight size={16} /></div>
        
        <div 
          className={`step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}
          onClick={() => excavatedSpec && setStep(2)}
        >
          <div className="step-number">2</div>
          <span className="step-label">Slice Stories</span>
        </div>
        <div className="step-arrow"><ArrowRight size={16} /></div>

        <div 
          className={`step-indicator ${step >= 3 ? 'active' : ''}`}
          onClick={() => stories.length > 0 && setStep(3)}
        >
          <div className="step-number">3</div>
          <span className="step-label">Stress Audit</span>
        </div>
      </div>

      {/* Core Split Dashboard */}
      <div className="dashboard-grid">
        {/* Left Side: Input & Settings Controller */}
        <div className="panel-card">
          <div className="panel-title">
            <Layers size={20} />
            <span>Refinement Input</span>
          </div>

          <div className="form-group">
            <label className="form-label">Quick Templates</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {TEMPLATES.map((tmpl, idx) => (
                <button 
                  key={idx}
                  className="btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setRawNotes(tmpl.text)}
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Raw Feature Notes / Ideas</label>
            <textarea 
              className="textarea-input"
              placeholder="Paste vague, messy specs from stakeholder emails, Slack channels, or draft notes here..."
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
            />
          </div>

          <button 
            className="btn-primary" 
            onClick={handleExcavate} 
            disabled={isExcavating || !rawNotes.trim()}
          >
            {isExcavating ? (
              <>
                <RefreshCw className="loading-spinner" size={18} style={{ border: 'none', borderTop: '2px solid white' }} />
                <span>Excavating Specs...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Analyze Spec (Excavator)</span>
              </>
            )}
          </button>
          
          {excavateError && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              <AlertTriangle size={16} />
              <span>{excavateError}</span>
            </div>
          )}

          {excavatedSpec && (
            <button 
              className="btn-primary" 
              style={{ background: 'var(--secondary-gradient)', marginTop: '0.5rem' }}
              onClick={handleSlice} 
              disabled={isSlicing}
            >
              {isSlicing ? (
                <>
                  <RefreshCw className="loading-spinner" size={18} style={{ border: 'none', borderTop: '2px solid white' }} />
                  <span>Slicing to Stories...</span>
                </>
              ) : (
                <>
                  <Layers size={18} />
                  <span>Slice Into Stories (Slicer)</span>
                </>
              )}
            </button>
          )}
          
          {sliceError && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              <AlertTriangle size={16} />
              <span>{sliceError}</span>
            </div>
          )}
        </div>

        {/* Right Side: Step Viewer Panel */}
        <div className="panel-card" style={{ flexGrow: 1 }}>
          
          {/* STEP 1: EXCAVATOR OUTPUT */}
          {step === 1 && (
            <div className="step-content-box">
              <div className="panel-title">
                <FileText size={20} />
                <span>Step 1: Excavator Synthesis Output</span>
              </div>
              
              {!excavatedSpec && !isExcavating && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '6rem 0' }}>
                  <p>Provide raw notes on the left and run the Excavator to synthesize specs.</p>
                </div>
              )}

              {isExcavating && (
                <div className="skeleton-loader" style={{ padding: '2rem 0' }}>
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line para"></div>
                  <div className="skeleton-line para"></div>
                  <div className="skeleton-line para"></div>
                  <div className="skeleton-line short"></div>
                </div>
              )}

              {excavatedSpec && !isExcavating && (
                <>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Below is the structured output generated by <strong>The Excavator</strong>. Review functional specs, non-functional rules, and identified gaps.
                  </p>
                  <div className="spec-rendered-box">
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--text-main)' }}>
                      {excavatedSpec}
                    </pre>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button className="btn-outline" onClick={() => setStep(2)}>
                      <span>Next: Slicer</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: SLICER STORIES */}
          {step === 2 && (
            <div className="step-content-box">
              <div className="panel-title">
                <Layers size={20} />
                <span>Step 2: Sliced User Stories</span>
              </div>

              {!excavatedSpec && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '6rem 0' }}>
                  <p>Synthesize requirements using Step 1 first.</p>
                </div>
              )}

              {excavatedSpec && stories.length === 0 && !isSlicing && (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                    Specs are ready. Trigger the Slicer Agent to create micro user stories.
                  </p>
                  <button className="btn-primary" style={{ maxWidth: '280px', margin: '0 auto' }} onClick={handleSlice}>
                    <Layers size={18} />
                    <span>Run Slicer Agent</span>
                  </button>
                </div>
              )}

              {isSlicing && (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <div className="loading-text">The Slicer is applying the SPIDR framework to vertical slice your spec...</div>
                </div>
              )}

              {stories.length > 0 && !isSlicing && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <strong>The Slicer</strong> created the following vertical slices. You can edit card inputs directly.
                    </p>
                    <button className="btn-outline" onClick={handleAddStory}>
                      <Plus size={16} />
                      <span>Add Slice</span>
                    </button>
                  </div>

                  <div className="stories-list">
                    {stories.map((story, idx) => (
                      <div className="story-card" key={story.id || idx}>
                        <div className="story-card-header">
                          <span className="story-badge">Slice {idx + 1}</span>
                          <button 
                            className="modal-close-btn" 
                            style={{ color: 'var(--text-muted)' }}
                            onClick={() => handleDeleteStory(idx)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <input 
                          type="text" 
                          className="story-title-input" 
                          value={story.title} 
                          onChange={(e) => handleUpdateStoryField(idx, 'title', e.target.value)} 
                          placeholder="Story Title"
                        />

                        <div className="story-statement-box">
                          <div className="story-statement-part">
                            <span className="story-keyword">AS A</span>
                            <input 
                              type="text" 
                              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f4f4f5', width: '100%' }}
                              value={story.asA} 
                              onChange={(e) => handleUpdateStoryField(idx, 'asA', e.target.value)}
                            />
                          </div>
                          <div className="story-statement-part">
                            <span className="story-keyword">I WANT TO</span>
                            <input 
                              type="text" 
                              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f4f4f5', width: '100%' }}
                              value={story.iWantTo} 
                              onChange={(e) => handleUpdateStoryField(idx, 'iWantTo', e.target.value)}
                            />
                          </div>
                          <div className="story-statement-part">
                            <span className="story-keyword">SO THAT</span>
                            <input 
                              type="text" 
                              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f4f4f5', width: '100%' }}
                              value={story.soThat} 
                              onChange={(e) => handleUpdateStoryField(idx, 'soThat', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="story-criteria-box">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="story-criteria-title">Acceptance Criteria</span>
                            <button 
                              className="btn-outline" 
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '5px' }}
                              onClick={() => handleAddAC(idx)}
                            >
                              <Plus size={12} /> Add Rule
                            </button>
                          </div>

                          {(story.acceptanceCriteria || []).map((ac, acIdx) => (
                            <div className="story-ac-item" key={acIdx}>
                              <span className="ac-keyword">&bull;</span>
                              <input 
                                type="text"
                                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#a1a1aa', width: '100%', fontSize: '0.85rem' }}
                                value={ac} 
                                onChange={(e) => handleUpdateStoryAC(idx, acIdx, e.target.value)}
                              />
                              <button 
                                className="modal-close-btn" 
                                style={{ padding: '0 0.2rem' }}
                                onClick={() => handleDeleteAC(idx, acIdx)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="story-actions">
                          <button 
                            className="btn-outline" 
                            style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
                            onClick={() => startAdversaryAudit(idx)}
                          >
                            <ShieldAlert size={16} />
                            <span>Stress Test with Adversary</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button className="btn-outline" onClick={() => setStep(3)}>
                      <span>Next: Export / Backlog View</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: EXPORT BACKLOG */}
          {step === 3 && (
            <div className="step-content-box">
              <div className="panel-title">
                <Check size={20} style={{ color: '#10b981' }} />
                <span>Step 3: Refined Backlog Release Center</span>
              </div>

              {stories.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '6rem 0' }}>
                  <p>Generate sliced user stories in Step 2 first.</p>
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Your backlog has been fully analyzed, vertically sliced, and audited for edge cases. Export or copy it below.
                  </p>

                  <div className="export-panel">
                    <div className="export-header">
                      <span className="export-title">Active Release Actions</span>
                      <div className="export-actions">
                        <button className="btn-outline" onClick={copyToClipboard}>
                          <Copy size={16} />
                          <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
                        </button>
                        <button className="btn-outline" onClick={downloadMarkdownFile}>
                          <Download size={16} />
                          <span>Download MD</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="panel-title" style={{ fontSize: '1.1rem', marginTop: '1rem' }}>
                    <FileText size={18} />
                    <span>Markdown Output Preview</span>
                  </div>

                  <div className="spec-rendered-box" style={{ background: '#0e0e17' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {generateMarkdownBacklog()}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Adversary Audit Modal Window */}
      {auditingIndex !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                <ShieldAlert size={20} style={{ color: '#ef4444' }} />
                <span>Auditing Story: "{stories[auditingIndex]?.title}"</span>
              </div>
              <button className="modal-close-btn" onClick={closeAdversaryModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="adversary-intro">
                <strong>The Adversary</strong> acts as a cynical QA and Security Architect. It reviews your user story to find hidden race conditions, offline sync issues, or UI locking bugs, proposing strict given-when-then criteria for them.
              </div>

              {isAuditing && (
                <div className="loading-container" style={{ padding: '2rem 0' }}>
                  <div className="loading-spinner" style={{ borderColor: 'rgba(239,68,68,0.1)', borderTopColor: '#ef4444' }}></div>
                  <div className="loading-text" style={{ color: '#fca5a5' }}>The Adversary is hunting for edge cases...</div>
                </div>
              )}

              {adversaryError && (
                <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                  {adversaryError}
                </div>
              )}

              {!isAuditing && vulnerabilities.length > 0 && (
                <>
                  <p className="form-label" style={{ color: 'var(--text-main)' }}>Select edge cases to append to acceptance criteria:</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {vulnerabilities.map((vuln, vIdx) => {
                      const isSelected = selectedVulnIndices.includes(vIdx)
                      return (
                        <div 
                          className={`adversary-card-item ${isSelected ? 'selected' : ''}`}
                          key={vIdx}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedVulnIndices(selectedVulnIndices.filter(i => i !== vIdx))
                            } else {
                              setSelectedVulnIndices([...selectedVulnIndices, vIdx])
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="adversary-card-check">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {}} // Controlled by card click
                            />
                          </div>
                          <div className="adversary-card-content">
                            <div className="adversary-card-title">{vuln.title}</div>
                            <div className="adversary-card-desc">{vuln.description}</div>
                            <div style={{ marginTop: '0.25rem' }}>
                              {vuln.acceptanceCriteria.map((ac, acIdx) => (
                                <div key={acIdx} style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                                  <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>&bull;</span> {ac}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-outline" onClick={closeAdversaryModal}>
                Cancel
              </button>
              <button 
                className="btn-adversary" 
                onClick={applyVulnerabilities}
                disabled={selectedVulnIndices.length === 0}
              >
                Apply Selected ({selectedVulnIndices.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
