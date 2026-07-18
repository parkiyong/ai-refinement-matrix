# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A web dashboard that orchestrates a six-agent pipeline to automate backlog refinement. Raw feature notes go in → structured specs, vertically-sliced user stories, edge-case audits, architecture checks, developer subtasks, and QA test contracts come out.

## Commands

```bash
# Development (runs Hono backend on :3000 + Vite frontend on :5173 concurrently)
npm run dev

# Production build
npm run build        # tsc && vite build
npm start            # serves built frontend + API on :3000
```

No test runner, linter, or formatter is configured.

## Architecture

### Two-process dev setup
- **Frontend**: React 18 + Vite (`src/`). Single-page app in one component (`src/App.tsx`) with vanilla CSS (`src/App.css`). Vite proxies `/api/*` to the backend.
- **Backend**: Hono on Node.js (`server.ts`). Six POST endpoints that shell out to the `agy` CLI (Antigravity TUI) via `execFile` — no shell injection risk. In production, also serves the built frontend from `dist/`.

### API endpoints (all POST, JSON in/out)
| Route | Agent | Input | Output |
|---|---|---|---|
| `/api/excavate` | excavator | `{notes}` | `{result}` (markdown) |
| `/api/slice` | slicer | `{spec}` | `{stories[]}` (JSON array) |
| `/api/adversary` | adversary | `{story}` | `{edgeCases[]}` |
| `/api/realist` | realist | `{story, designDoc}` | `{isCompatible, violations[], feedback}` |
| `/api/decompose` | decomposer | `{story, designDoc}` | `{tasks[]}` |
| `/api/guardian` | guardian | `{story, tasks[]}` | `{testContracts[]}` |

All endpoints call `runAgyAgent(agentName, prompt)` which runs `agy --agent <name> --dangerously-skip-permissions --print <prompt>` with a 2-minute timeout. Agent output is expected to be raw JSON (arrays or objects); the server extracts JSON by finding first `[`/`{` and last `]`/`}` boundaries.

### Agent definitions (`ai-refinement-plugin/agents/`)
Six markdown files with YAML frontmatter (`name`, `description`) + system prompts. These are Antigravity custom agent configs meant to be copied to `~/.gemini/config/plugins/ai-refinement-plugin/`. All agents are text-only (no tool use) and output structured JSON (except excavator which outputs markdown).

### Frontend flow (all in `src/App.tsx`)
Three-step wizard:
1. **Excavate** — raw notes → structured spec (markdown)
2. **Slice & Audit** — spec → user stories (JSON) + optional Adversary edge-case modal
3. **Engineering Refinement** (toggle) — per-story pipeline: Realist (arch check) → Decomposer (subtasks) → Guardian (test contracts). Interactive checklist with inline editing.
4. **Export** — markdown backlog download or clipboard copy

### CSS design system (`src/App.css`)
- CSS custom properties for theming (dark default, `[data-theme="light"]` override)
- Glassmorphism cards with backdrop-filter
- Fonts: Outfit (titles) + Inter (body), loaded from Google Fonts in `index.html`
- Color palette: cyan (`#06b6d4`) + violet (`#a855f7`) gradients

## Key Conventions

- TypeScript strict mode. `tsconfig.json` targets ES2022, bundler module resolution, `noEmit` (Vite handles emit).
- All state lives in `App.tsx` via `useState` — no state library, no router.
- Theme preference persisted in `localStorage`.
- Agent JSON parsing is lenient: finds first/last JSON boundary chars in CLI output rather than expecting clean JSON.
- The `agy` CLI must be installed and authenticated on the host machine for the backend to function.
