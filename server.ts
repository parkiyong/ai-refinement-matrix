import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const execFileAsync = promisify(execFile)
const app = new Hono()

// Enable CORS for development
app.use('/api/*', cors())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Interfaces for Requests
interface ExcavateRequest {
  notes: string
}

interface SliceRequest {
  spec: string
}

interface Story {
  id?: string
  title: string
  asA: string
  iWantTo: string
  soThat: string
  acceptanceCriteria: string[]
}

interface AdversaryRequest {
  story: Story
}

interface EdgeCase {
  title: string
  description: string
  acceptanceCriteria: string[]
}

// Helper to run agy CLI command safely using spawn/execFile (no shell injection risk)
async function runAgyAgent(agentName: string, prompt: string): Promise<string> {
  console.log(`[Backend] Invoking agy with agent: ${agentName}...`)
  
  try {
    const { stdout, stderr } = await execFileAsync('agy', [
      '--agent', agentName,
      '--dangerously-skip-permissions',
      '--print', prompt
    ], {
      timeout: 120000, // 2-minute timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    })
    
    if (stderr && stderr.trim().length > 0) {
      console.warn(`[Backend] agy stderr: ${stderr}`)
    }
    
    return stdout
  } catch (error: any) {
    console.error(`[Backend] Error running agy:`, error)
    throw new Error(error.stdout || error.message || 'CLI execution failed')
  }
}

// API Endpoints
app.post('/api/excavate', async (c) => {
  try {
    const { notes } = await c.req.json<ExcavateRequest>()
    if (!notes || notes.trim() === '') {
      return c.json({ error: 'Raw notes are required' }, 400)
    }
    
    const output = await runAgyAgent('excavator', notes)
    return c.json({ result: output })
  } catch (err: any) {
    return c.json({ error: err.message || 'An error occurred during excavation' }, 500)
  }
})

app.post('/api/slice', async (c) => {
  try {
    const { spec } = await c.req.json<SliceRequest>()
    if (!spec || spec.trim() === '') {
      return c.json({ error: 'Specification is required' }, 400)
    }
    
    const output = await runAgyAgent('slicer', spec)
    
    let stories: Story[] = []
    try {
      const jsonStart = output.indexOf('[')
      const jsonEnd = output.lastIndexOf(']') + 1
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = output.substring(jsonStart, jsonEnd)
        stories = JSON.parse(jsonStr) as Story[]
      } else {
        throw new Error('JSON boundaries not found')
      }
    } catch (parseErr) {
      console.warn('[Backend] Failed to parse slicer JSON directly, sending raw text back.', parseErr)
      return c.json({ error: 'Failed to parse user stories as JSON.', rawResult: output }, 422)
    }
    
    return c.json({ stories })
  } catch (err: any) {
    return c.json({ error: err.message || 'An error occurred during slicing' }, 500)
  }
})

app.post('/api/adversary', async (c) => {
  try {
    const { story } = await c.req.json<AdversaryRequest>()
    if (!story) {
      return c.json({ error: 'Story object is required' }, 400)
    }
    
    const prompt = `Review this user story:
Title: ${story.title}
As a: ${story.asA}
I want to: ${story.iWantTo}
So that: ${story.soThat}
Acceptance Criteria:
${(story.acceptanceCriteria || []).map(ac => `- ${ac}`).join('\n')}

Identify 5 obscure edge cases/vulnerabilities and output them as a JSON array.`
    
    const output = await runAgyAgent('adversary', prompt)
    
    let edgeCases: EdgeCase[] = []
    try {
      const jsonStart = output.indexOf('[')
      const jsonEnd = output.lastIndexOf(']') + 1
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = output.substring(jsonStart, jsonEnd)
        edgeCases = JSON.parse(jsonStr) as EdgeCase[]
      } else {
        throw new Error('JSON boundaries not found')
      }
    } catch (parseErr) {
      console.warn('[Backend] Failed to parse adversary JSON directly.', parseErr)
      return c.json({ error: 'Failed to parse edge cases as JSON.', rawResult: output }, 422)
    }
    
    return c.json({ edgeCases })
  } catch (err: any) {
    return c.json({ error: err.message || 'An error occurred during adversary audit' }, 500)
  }
})

// Serve React Frontend Static Assets in Production
if (process.env.NODE_ENV === 'production') {
  console.log('[Backend] Running in Production mode. Serving static assets...')
  
  app.use('/*', serveStatic({ 
    root: './dist',
    rewriteRequestPath: (path) => {
      if (path.includes('.') || path.startsWith('/api/')) {
        return path
      }
      return '/index.html'
    }
  }))
}

// Start Server
const port = 3000
console.log(`[Backend] Hono API Server starting on http://localhost:${port}`)
serve({
  fetch: app.fetch,
  port
})
