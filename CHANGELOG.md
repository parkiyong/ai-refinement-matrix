# Changelog

All notable changes to the AI Refinement Matrix project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-16

### Added
- **Polished Light & Dark Theme Toggle**:
  - Added a floating theme toggle button in the top-right corner of the dashboard rendering adaptive Lucide `Sun` and `Moon` icons.
  - Implemented comprehensive light theme variables and element style overrides in `App.css` to build a sleek slate/blue light theme.
  - Cleaned up inline static color styles across story cards, input areas, realist audits, and checklists in `App.tsx` to use CSS variables.
  - Configured automatic state syncing and browser local storage persistence.

## [1.1.0] - 2026-07-16

### Added
- **The Engineer's Technical Refinement Loop**:
  - Integrated three technical "cynic" agents to validate slices bottom-up:
    - **The Realist**: Audits PO vertical slices against actual System/Code Architecture to check for conflicts or technical debt.
    - **The Decomposer**: Breaks validated stories down into specific subtasks (files affected, dev action steps).
    - **The Guardian**: Appends automated test requirements (Unit, Integration, and Mock Data contracts) to each subtask.
- **Interactive UI Subtasks Checklist**:
  - Added an inline, glassmorphic checklist panel inside user story cards when "Engineering Refinement Mode" is active.
  - Features full interactive checklist controls to check off, add, edit, or delete technical subtasks and test specifications.
- **Architect Design Doc Input**:
  - Added a shared "Lead Architect Design Doc Context" text area in Step 2 for architectural input.
- **API Endpoints**:
  - Added `/api/realist`, `/api/decompose`, and `/api/guardian` endpoints in `server.ts` to interface with the new agents.
- **Export System Enrichment**:
  - Enhanced the markdown export preview (Step 3) to append the refined developer subtask checklists and test contracts.
