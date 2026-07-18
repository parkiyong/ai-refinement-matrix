---
type: Service
title: Hono API Server Backend
description: Hono-based web server executing agy agent scripts and serving the dashboard.
tags:
- backend
- server
- api
- hono
timestamp: '2026-07-18T19:52:00Z'
---

# Hono API Server Backend

The backend is written in TypeScript and runs using [Hono](https://hono.dev/) on Node.js (`server.ts`).

## Endpoints

All endpoints are prefix-grouped under `/api/*` with CORS enabled:

* `POST /api/excavate` - Mines raw notes using `excavator`.
* `POST /api/slice` - Slices specifications using `slicer`.
* `POST /api/adversary` - Stress-tests stories using `adversary`.
* `POST /api/realist` - Audits vertical slices against design using `realist`.
* `POST /api/decompose` - Splits stories into code tasks using `decomposer`.
* `POST /api/guardian` - Configures QA test contracts using `guardian`.

## Execution Mechanics
The backend spawns subprocesses to interface with `agy`.
To prevent command injection, the server invokes `execFile` rather than running commands in a shell context:

```typescript
const { stdout, stderr } = await execFileAsync('agy', [
  '--agent', agentName,
  '--dangerously-skip-permissions',
  '--print', prompt
], { timeout: 120000 })
```

Related Concepts:
- [Architecture](architecture.md)
- [Dashboard UI](dashboard.md)
- [Agent Roles](agent-roles.md)
- [server.ts:89](/server.ts:89)
