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
interface TechnicalTask {
  id: string
  title: string
  description: string
  filesAffected: string[]
  unitTestContract?: string
  integrationTestContract?: string
  mockDataRequired?: string
  completed: boolean
}

interface RealistViolation {
  title: string
  description: string
  impact: string
}

interface RealistAudit {
  isCompatible: boolean
  violations: RealistViolation[]
  feedback: string
}

interface Story {
  id: string
  title: string
  asA: string
  iWantTo: string
  soThat: string
  acceptanceCriteria: string[]
  realistAudit?: RealistAudit
  technicalTasks?: TechnicalTask[]
  overrideRealist?: boolean
  refinementStatus?: 'idle' | 'realist_checking' | 'decomposing' | 'guardian_contracting' | 'completed' | 'failed'
  refinementError?: string
}

interface Vulnerability {
  title: string
  description: string
  acceptanceCriteria: string[]
}

interface Template {
  name: string
  text: string
  designDoc?: string
}

// Templates to help POs get started
const TEMPLATES: Template[] = [
  {
    name: "User Filter Chips",
    text: `As a developer, I want a reusable Filter Chip component in our UI.
Stakeholders want it to look like modern chip filters (pill-shaped, outline/filled states).
It needs to support single-select and multi-select modes.
Filters should update the URL search query parameters dynamically so users can bookmark filtered views.
It must handle long category text gracefully (truncation) and be keyboard accessible.`,
    designDoc: `## Reusable UI Component & State Architecture

- **Framework & Styles**: React with Tailwind/Vanilla CSS Variables. Custom components must live in \`src/components/ui/\`.
- **Filter State Management**: Must synchronize with URL search parameters (e.g. \`?tags=react,typescript\`) using native \`URLSearchParams\` to ensure deep linking and bookmarking.
- **Accessibility (A11y)**: Must meet WAI-ARIA standards for filter chips: \`role="checkbox"\`, \`aria-checked\`, support \`Space\`/\`Enter\` key presses.
- **Performance**: Chip lists with dynamic filter updates must avoid full page re-renders. Component must be pure and memoized if rendering list size exceeds 100 items.`
  },
  {
    name: "Double Submit Protection",
    text: `PO Request: Build double submit prevention for checkout.
We are seeing duplicate charge records in DB.
Frontend needs to disable the checkout submit button instantly upon click.
Show a loading spinner.
Handle cases where the checkout fails and let the user submit again.
We must support slow 3G connections (sometimes requests take up to 30s).`,
    designDoc: `## API Idempotency & Transaction Safety Gate

- **Client-Side Submits**: Forms must disable button and display a loading indicator immediately on click. Action locks state to prevent concurrent clicks.
- **API Protocol**: Every write transaction (e.g., charge, purchase) must generate and attach a unique UUID v4 client-side as an \`X-Idempotency-Key\` header.
- **Server Layer**: Backend (Hono) must validate the \`X-Idempotency-Key\` using Redis cache with a 120-second TTL. Duplicate requests within TTL must yield cached responses (200 OK) without re-executing transactions.
- **Database Constraints**: DB schema must have a \`unique_idempotency_key\` constraint on payments table as a fallback safety measure.`
  }
]

const TEMPLATE_DESIGN_DOC = `## System Architecture & Conventions

- **State Management**: React state + URL Search Params (via native Web API).
- **Backend API**: Node.js + Hono, JSON RESTful API.
- **Database Schema**: SQLite local sync layer or PostgreSQL remote tables.
- **UI System**: Vanilla CSS Variables, Lucide icons, glassmorphism design.
- **Testing Rules**:
  - Unit tests using Vitest (mock external service APIs).
  - Component/Widget tests for UI components.
  - Mock API payloads must match strict JSON validation schemas.
- **Safety Gate**:
  - Double submit prevention must be verified at both frontend (disable UI) and backend (idempotency keys).
  - Offline mode requires a local IndexedDB state manager.`

export default function App() {
  const [step, setStep] = useState<number>(1)
  const [rawNotes, setRawNotes] = useState<string>('')
  
  // Engineering Mode states
  const [engineeringMode, setEngineeringMode] = useState<boolean>(false)
  const [designDoc, setDesignDoc] = useState<string>(TEMPLATE_DESIGN_DOC)
  
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

  const runTechnicalRefinement = async (index: number, forceDecompose = false) => {
    // Clear previous error/status
    setStories(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        refinementError: '',
        refinementStatus: 'realist_checking'
      }
      return updated
    })

    try {
      // Fetch latest story
      const currentStory = stories[index]
      let runDecomposerAndGuardian = false

      if (!forceDecompose && !currentStory.overrideRealist) {
        // Phase 1: Realist Check
        const realistResponse = await fetch('/api/realist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story: currentStory, designDoc })
        })
        
        if (!realistResponse.ok) {
          const errData = await realistResponse.json()
          throw new Error(errData.error || 'Realist audit failed')
        }
        
        const realistResult = await realistResponse.json()
        
        setStories(prev => {
          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            realistAudit: realistResult,
            refinementStatus: realistResult.isCompatible ? 'decomposing' : 'idle'
          }
          return updated
        })
        
        if (realistResult.isCompatible) {
          runDecomposerAndGuardian = true
        }
      } else {
        setStories(prev => {
          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            refinementStatus: 'decomposing'
          }
          return updated
        })
        runDecomposerAndGuardian = true
      }

      if (runDecomposerAndGuardian) {
        // Phase 2: Decomposer
        const decomposeResponse = await fetch('/api/decompose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story: currentStory, designDoc })
        })

        if (!decomposeResponse.ok) {
          const errData = await decomposeResponse.json()
          throw new Error(errData.error || 'Decomposition failed')
        }

        const decomposeResult = await decomposeResponse.json()
        const tasks = decomposeResult.tasks || []

        // Phase 3: Guardian
        setStories(prev => {
          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            refinementStatus: 'guardian_contracting'
          }
          return updated
        })

        const guardianResponse = await fetch('/api/guardian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story: currentStory, tasks })
        })

        if (!guardianResponse.ok) {
          const errData = await guardianResponse.json()
          throw new Error(errData.error || 'Guardian contract generation failed')
        }

        const guardianResult = await guardianResponse.json()
        const testContracts = guardianResult.testContracts || []

        // Merge results
        const refinedTasks: TechnicalTask[] = tasks.map((t: any) => {
          const contract = testContracts.find((tc: any) => tc.id === t.id)
          return {
            id: t.id,
            title: t.title || 'Untitled Task',
            description: t.description || '',
            filesAffected: t.filesAffected || [],
            unitTestContract: contract?.unitTestContract || '',
            integrationTestContract: contract?.integrationTestContract || '',
            mockDataRequired: contract?.mockDataRequired || '',
            completed: false
          }
        })

        setStories(prev => {
          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            technicalTasks: refinedTasks,
            refinementStatus: 'completed'
          }
          return updated
        })
      }
    } catch (err: any) {
      console.error(err)
      setStories(prev => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          refinementStatus: 'failed',
          refinementError: err.message || 'An error occurred'
        }
        return updated
      })
    }
  }

  const handleOverrideRealist = (index: number) => {
    setStories(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        overrideRealist: true
      }
      return updated
    })
    runTechnicalRefinement(index, true)
  }

  const handleResetRefinement = (index: number) => {
    setStories(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        realistAudit: undefined,
        technicalTasks: undefined,
        overrideRealist: false,
        refinementStatus: 'idle',
        refinementError: ''
      }
      return updated
    })
  }

  const handleUpdateTaskField = (storyIndex: number, taskIndex: number, field: keyof TechnicalTask, value: any) => {
    setStories(prev => {
      const updated = [...prev]
      const story = updated[storyIndex]
      if (story.technicalTasks) {
        const updatedTasks = [...story.technicalTasks]
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          [field]: value
        }
        updated[storyIndex] = {
          ...story,
          technicalTasks: updatedTasks
        }
      }
      return updated
    })
  }

  const handleAddTechnicalTask = (storyIndex: number) => {
    setStories(prev => {
      const updated = [...prev]
      const story = updated[storyIndex]
      const currentTasks = story.technicalTasks || []
      const newTask: TechnicalTask = {
        id: `task-manual-${Date.now()}`,
        title: 'New Technical Task',
        description: 'Description of task steps...',
        filesAffected: [],
        unitTestContract: '',
        integrationTestContract: '',
        mockDataRequired: '',
        completed: false
      }
      updated[storyIndex] = {
        ...story,
        technicalTasks: [...currentTasks, newTask],
        refinementStatus: story.refinementStatus === 'completed' ? 'completed' : 'idle'
      }
      return updated
    })
  }

  const handleDeleteTechnicalTask = (storyIndex: number, taskIndex: number) => {
    setStories(prev => {
      const updated = [...prev]
      const story = updated[storyIndex]
      if (story.technicalTasks) {
        const updatedTasks = [...story.technicalTasks]
        updatedTasks.splice(taskIndex, 1)
        updated[storyIndex] = {
          ...story,
          technicalTasks: updatedTasks
        }
      }
      return updated
    })
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
        
        if (story.technicalTasks && story.technicalTasks.length > 0) {
          md += `\n#### Technical Subtasks Checklist:\n`
          story.technicalTasks.forEach((task, tIdx) => {
            const status = task.completed ? 'x' : ' '
            md += `- [${status}] **Task ${tIdx + 1}: ${task.title}**\n`
            md += `  - *Description:* ${task.description}\n`
            if (task.filesAffected && task.filesAffected.length > 0) {
              md += `  - *Files Affected:* ${task.filesAffected.join(', ')}\n`
            }
            if (task.unitTestContract) {
              md += `  - *Unit Test Contract:* ${task.unitTestContract}\n`
            }
            if (task.integrationTestContract) {
              md += `  - *Integration Test Contract:* ${task.integrationTestContract}\n`
            }
            if (task.mockDataRequired) {
              md += `  - *Mock Data Required:* ${task.mockDataRequired}\n`
            }
          })
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
                  onClick={() => {
                    setRawNotes(tmpl.text)
                    if (tmpl.designDoc) {
                      setDesignDoc(tmpl.designDoc)
                    }
                  }}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        <strong>The Slicer</strong> created the following vertical slices. You can edit card inputs directly.
                      </p>
                      
                      {/* Engineering Mode Switch Toggle */}
                      <div className="engineering-toggle-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <label className="switch-toggle">
                          <input 
                            type="checkbox" 
                            checked={engineeringMode} 
                            onChange={(e) => setEngineeringMode(e.target.checked)} 
                            className="switch-checkbox"
                          />
                          <span className="switch-slider"></span>
                        </label>
                        <span className="engineering-toggle-text" style={{ fontSize: '0.85rem', fontWeight: 600, color: engineeringMode ? '#06b6d4' : 'var(--text-muted)' }}>
                          Engineering Refinement Mode {engineeringMode ? 'Active ⚡' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <button className="btn-outline" onClick={handleAddStory}>
                      <Plus size={16} />
                      <span>Add Slice</span>
                    </button>
                  </div>

                  {/* Collapsible/Shared Lead Architect Design Doc Card */}
                  {engineeringMode && (
                    <div className="panel-card design-doc-panel" style={{ marginBottom: '1.5rem', background: 'rgba(6, 182, 212, 0.03)', border: '1px dashed rgba(6, 182, 212, 0.3)' }}>
                      <div className="panel-title" style={{ fontSize: '1.1rem', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Layers size={18} style={{ color: '#06b6d4' }} />
                          <span>Lead Architect Design Doc Context</span>
                        </div>
                        <span className="badge-architect" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>Architect Role Active</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        {TEMPLATES.map((tmpl, tmplIdx) => tmpl.designDoc && (
                          <button
                            key={tmplIdx}
                            className="btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px' }}
                            onClick={() => setDesignDoc(tmpl.designDoc || '')}
                          >
                            Use {tmpl.name} Doc
                          </button>
                        ))}
                      </div>

                      <textarea
                        className="textarea-input"
                        style={{ minHeight: '120px', fontSize: '0.85rem', fontFamily: 'monospace', width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', padding: '0.75rem', outline: 'none' }}
                        value={designDoc}
                        onChange={(e) => setDesignDoc(e.target.value)}
                        placeholder="Paste architecture constraints, conventions, db schemas, or testing rules here..."
                      />
                    </div>
                  )}

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

                        {/* Engineering Refinement Panel */}
                        {engineeringMode && (
                          <div className="engineering-refinement-card" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                            <div className="refinement-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <span className="refinement-badge" style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>TECHNICAL REFINEMENT</span>
                              
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {(story.refinementStatus === 'realist_checking' || story.refinementStatus === 'decomposing' || story.refinementStatus === 'guardian_contracting') && (
                                  <div className="status-spinner-text" style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#06b6d4', gap: '0.25rem' }}>
                                    <RefreshCw className="loading-spinner" size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                    <span>
                                      {story.refinementStatus === 'realist_checking' && 'Realist Checking...'}
                                      {story.refinementStatus === 'decomposing' && 'Decomposing Tasks...'}
                                      {story.refinementStatus === 'guardian_contracting' && 'Guardian Contracting...'}
                                    </span>
                                  </div>
                                )}
                                
                                {(!story.refinementStatus || story.refinementStatus === 'idle' || story.refinementStatus === 'failed' || story.refinementStatus === 'completed') && (
                                  <>
                                    <button 
                                      className="btn-primary"
                                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', background: 'var(--secondary-gradient)' }}
                                      onClick={() => runTechnicalRefinement(idx)}
                                    >
                                      {story.technicalTasks && story.technicalTasks.length > 0 ? 'Re-Run Refinement' : 'Run Technical Refinement'}
                                    </button>
                                    {story.technicalTasks && story.technicalTasks.length > 0 && (
                                      <button 
                                        className="btn-outline"
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
                                        onClick={() => handleResetRefinement(idx)}
                                      >
                                        Clear
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Realist Audit Warnings / Success */}
                            {story.realistAudit && (
                              <div className={`realist-audit-container ${story.realistAudit.isCompatible ? 'compatible' : 'incompatible'}`} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="audit-summary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  {story.realistAudit.isCompatible ? (
                                    <span className="audit-success-msg" style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>✓ Architecture Compatible</span>
                                  ) : (
                                    <span className="audit-warning-msg" style={{ color: '#fca5a5', fontWeight: 600, fontSize: '0.85rem' }}>⚠ Architecture Conflict Detected</span>
                                  )}
                                </div>
                                
                                {story.realistAudit.violations && story.realistAudit.violations.length > 0 && (
                                  <div className="audit-violations-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {story.realistAudit.violations.map((violation, vIdx) => (
                                      <div key={vIdx} className="violation-item" style={{ fontSize: '0.8rem', paddingLeft: '0.5rem', borderLeft: '2px solid #f43f5e' }}>
                                        <span className={`violation-impact ${violation.impact.toLowerCase()}`} style={{ fontWeight: 'bold', color: violation.impact === 'Blocker' ? '#ef4444' : '#f59e0b', marginRight: '0.25rem' }}>
                                          [{violation.impact}]
                                        </span>
                                        <strong style={{ color: 'var(--text-main)' }}>{violation.title}</strong>: <span style={{ color: 'var(--text-muted)' }}>{violation.description}</span>
                                      </div>
                                    ))}
                                    
                                    {!story.overrideRealist && !story.realistAudit.isCompatible && (
                                      <button 
                                        className="btn-outline"
                                        style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fcd34d', alignSelf: 'flex-start', marginTop: '0.5rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                        onClick={() => handleOverrideRealist(idx)}
                                      >
                                        Override Warning & Decompose anyway
                                      </button>
                                    )}
                                  </div>
                                )}
                                
                                {story.realistAudit.feedback && (
                                  <p className="audit-feedback-text" style={{ fontSize: '0.8rem', color: '#d4d4d8', margin: '0.5rem 0 0 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                                    <strong style={{ color: '#06b6d4' }}>Realist Advice:</strong> {story.realistAudit.feedback}
                                  </p>
                                )}
                              </div>
                            )}

                            {story.refinementError && (
                              <div className="refinement-error-box" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                                ⚠ {story.refinementError}
                              </div>
                            )}

                            {/* Interactive Checklist of Subtasks */}
                            {story.technicalTasks && story.technicalTasks.length > 0 && (
                              <div className="technical-tasks-checklist" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                  <span className="tasks-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Developer Tasks & Test Specifications</span>
                                  <button 
                                    className="btn-outline"
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px' }}
                                    onClick={() => handleAddTechnicalTask(idx)}
                                  >
                                    + Add Task
                                  </button>
                                </div>

                                <div className="tasks-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {story.technicalTasks.map((task, tIdx) => (
                                    <div key={task.id || tIdx} className={`task-checkbox-item ${task.completed ? 'completed' : ''}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.75rem', opacity: task.completed ? 0.6 : 1 }}>
                                      <div className="task-checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                        <input 
                                          type="checkbox" 
                                          checked={task.completed}
                                          onChange={(e) => handleUpdateTaskField(idx, tIdx, 'completed', e.target.checked)}
                                          style={{ cursor: 'pointer', accentColor: '#a855f7', width: '15px', height: '15px' }}
                                        />
                                        <input 
                                          type="text"
                                          value={task.title}
                                          onChange={(e) => handleUpdateTaskField(idx, tIdx, 'title', e.target.value)}
                                          className="task-title-edit"
                                          style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f4f4f5', fontSize: '0.85rem', fontWeight: 600, width: '100%', borderBottom: '1px solid transparent', textDecoration: task.completed ? 'line-through' : 'none' }}
                                          placeholder="Task title..."
                                        />
                                        <button 
                                          className="modal-close-btn"
                                          style={{ color: 'var(--text-muted)', fontSize: '1rem', padding: '0 0.25rem' }}
                                          onClick={() => handleDeleteTechnicalTask(idx, tIdx)}
                                        >
                                          &times;
                                        </button>
                                      </div>

                                      <div className="task-details-row" style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        <div className="detail-field" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                          <span className="detail-label" style={{ fontSize: '0.7rem', color: '#a855f7', minWidth: '70px', fontWeight: 'bold' }}>Files:</span>
                                          <input 
                                            type="text" 
                                            value={Array.isArray(task.filesAffected) ? task.filesAffected.join(', ') : task.filesAffected}
                                            onChange={(e) => handleUpdateTaskField(idx, tIdx, 'filesAffected', e.target.value.split(',').map(s => s.trim()))}
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', color: '#d4d4d8', padding: '0.15rem 0.4rem', width: '100%', outline: 'none' }}
                                            placeholder="db/schema.ts, models/..."
                                          />
                                        </div>
                                        <div className="detail-field" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                          <span className="detail-label" style={{ fontSize: '0.7rem', color: '#06b6d4', minWidth: '70px', fontWeight: 'bold', marginTop: '0.2rem' }}>Steps:</span>
                                          <textarea 
                                            value={task.description}
                                            onChange={(e) => handleUpdateTaskField(idx, tIdx, 'description', e.target.value)}
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', color: '#d4d4d8', padding: '0.25rem 0.4rem', width: '100%', minHeight: '40px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                                            placeholder="Exact steps to build..."
                                          />
                                        </div>
                                        
                                        {/* QA Testing Contracts */}
                                        <div className="testing-contract-panel" style={{ background: 'rgba(0,0,0,0.15)', padding: '0.4rem 0.5rem', borderRadius: '6px', marginTop: '0.25rem', border: '1px solid rgba(255,255,255,0.02)' }}>
                                          <div className="testing-header" style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>QA Testing Contract</div>
                                          
                                          {task.unitTestContract !== undefined && (
                                            <div className="test-contract-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                              <span className="test-badge unit" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>Unit</span>
                                              <input 
                                                type="text" 
                                                value={task.unitTestContract}
                                                onChange={(e) => handleUpdateTaskField(idx, tIdx, 'unitTestContract', e.target.value)}
                                                style={{ background: 'transparent', border: 'none', outline: 'none', borderBottom: '1px solid transparent', color: 'var(--text-muted)', fontSize: '0.75rem', width: '100%' }}
                                                placeholder="Unit testing constraints..."
                                              />
                                            </div>
                                          )}
                                          {task.integrationTestContract !== undefined && (
                                            <div className="test-contract-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                              <span className="test-badge integration" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '3px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>Intg</span>
                                              <input 
                                                type="text" 
                                                value={task.integrationTestContract}
                                                onChange={(e) => handleUpdateTaskField(idx, tIdx, 'integrationTestContract', e.target.value)}
                                                style={{ background: 'transparent', border: 'none', outline: 'none', borderBottom: '1px solid transparent', color: 'var(--text-muted)', fontSize: '0.75rem', width: '100%' }}
                                                placeholder="Integration testing constraints..."
                                              />
                                            </div>
                                          )}
                                          {task.mockDataRequired !== undefined && (
                                            <div className="test-contract-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                              <span className="test-badge mock" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '3px', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>Mock</span>
                                              <input 
                                                type="text" 
                                                value={task.mockDataRequired}
                                                onChange={(e) => handleUpdateTaskField(idx, tIdx, 'mockDataRequired', e.target.value)}
                                                style={{ background: 'transparent', border: 'none', outline: 'none', borderBottom: '1px solid transparent', color: 'var(--text-muted)', fontSize: '0.75rem', width: '100%' }}
                                                placeholder="Mock data specs..."
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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
