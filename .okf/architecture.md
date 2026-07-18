---
type: ArchitecturalPattern
title: Refinement Matrix Architecture
description: Overview of the 6-agent cooperative loops and agy execution model.
tags:
- architecture
- agent-loop
- design
timestamp: '2026-07-18T19:50:00Z'
---

# Refinement Matrix Architecture

The AI Refinement Matrix splits product refinement into two major loops composed of six specialized agent roles.

```
       [ Raw Notes ]
             │
             ▼
  ┌─────────────────────┐
  │  PO Functional Loop │ ── Excavator, Slicer, Adversary
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │  Eng Technical Loop │ ── Realist, Decomposer, Guardian
  └─────────────────────┘
```

## PO Functional Loop
- **The Excavator**: Separates functional and non-functional requirements.
- **The Slicer**: Slices specs vertically using SPIDR framework.
- **The Adversary**: Stress-tests stories for bugs, security issues, and edge cases.

## Engineering Technical Loop
- **The Realist**: Audits vertical slices against architect design document.
- **The Decomposer**: Splits slices into granular developer checklists and file changes.
- **The Guardian**: Appends unit, integration, and mock testing contracts.

## Agent Execution Model
The backend executes the agent tasks by calling the `agy` CLI tool. It passes parameters for the target agent name and the prompt payload safely:
```bash
agy --agent <agent-name> --dangerously-skip-permissions --print <prompt>
```

Related Concepts:
- [Agent Roles](agent-roles.md)
- [Server Backend](server.md)
