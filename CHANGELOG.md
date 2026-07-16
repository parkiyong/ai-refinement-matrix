# Changelog

All notable changes to the AI Refinement Matrix project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-07-17

### Changed
- **Orchestration Engine Migration**: Migrated the agent runner backend from `agy` (Antigravity CLI) to the `claudecode` CLI (`claude`).
- **Dynamic Prompt Loading**: Implemented reading and parsing agent system instructions directly from local markdown configuration files (`ai-refinement-plugin/agents/*.md`), stripping YAML frontmatter automatically.
- **Claude Code CLI Integration**: Configured `claude` execution in non-interactive print mode with `--no-session-persistence` to prevent disk clutter, and `--tools ""` to ensure deterministic, safe text and JSON generation.
- **Warning Filtering**: Added clean stderr parsing to suppress stdin detection warnings in the backend console logs.
- **Documentation**: Updated the main README flow diagram to show the complete 6-agent pipeline (both PO and Engineering loops), and updated guides/instructions to use the `claudecode` CLI instead of `agy`.

## [1.2.1] - 2026-07-16

### Fixed
- **Excavator Spec Flow**: Prevented early auto-advancing to Step 2 upon successful excavation, allowing users to review synthesized specs first in Step 1.
- **Light Theme Accessibility**: Replaced hardcoded dark background and text colors inside the Realist Advice and Developer Tasks sections with responsive theme variables, ensuring high contrast and clean readability in light mode.
- **UI Renaming**: Renamed the "Quick Templates" header label and documentation references to "Examples" for better clarity.

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
