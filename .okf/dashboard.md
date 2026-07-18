---
type: Component
title: React Dashboard UI
description: Frontend React application orchestrating refinement runs and agent interactions.
tags:
- frontend
- UI
- react
- dashboard
timestamp: '2026-07-18T19:53:00Z'
---

# React Dashboard UI

The user interface is a Single Page Application (SPA) built with React and TypeScript (`src/App.tsx`).

## Core Views & Flow
1. **Raw Note Entry / Excavation**: The user types unstructured requirement ideas and runs the Excavator agent.
2. **Story Slicing**: Slices specifications into vertically structured user stories.
3. **Adversary Stress-test**: Triggers stress audits on each sliced story.
4. **Engineering Evaluation**: Runs the Realist, Decomposer, and Guardian to plan implementation steps and test contracts.

## Theme & Accessibility
- Supports light and dark mode toggling.
- Adheres to AAA/AA contrast guidelines under light/dark configurations.

Related Concepts:
- [Architecture](architecture.md)
- [Server Backend](server.md)
- [src/App.tsx:637](/src/App.tsx:637)
