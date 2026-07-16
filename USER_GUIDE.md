# AI Refinement Matrix - User Guide

Welcome to the **AI Refinement Matrix Dashboard**! This guide walks you through how to use the dashboard to turn vague, messy product requirements into highly specific, vertically-sliced, structurally validated, and test-hardened user stories with exact engineering checklists ready for execution.

---

## 🌟 Overview of the Refinement Team

The dashboard orchestrates six specialized AI agent personas split into a Product Owner (PO) functional loop and an Engineering technical loop:

### The PO Functional Loop
1.  **The Excavator (Systems Architect)**: Mines raw notes to separate *what* the system does (functional) from *how* it behaves (non-functional), while flagging scope gaps.
2.  **The Slicer (Agile Coach)**: Splits specifications into the smallest possible vertical slices (spanning database to frontend) using the **SPIDR framework**.
3.  **The Adversary (QA Lead & Security Engineer)**: A professional cynic that stress-tests stories to find race conditions, security flaws, and sad-path exceptions.

### The Engineering Technical Loop
4.  **The Realist (Senior Software Engineer)**: Audits the PO's vertical slices against a **Lead Architect Design Doc** to check for architectural conflicts and technical debt.
5.  **The Decomposer (Tech Lead)**: Shatters approved slices into granular developer checklists, listing files affected and coding action steps.
6.  **The Guardian (QA Automation Engineer)**: Appends automated test requirements (Unit, Integration, and Mock Data contracts) to each subtask.

---

## 🏃 Quick Start: Launching the Dashboard

To launch the application locally, open your terminal and run:

```bash
cd ~/GitHub/ai-refinement-matrix
npm run dev
```

Then, open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.

### 🌗 Theme Toggle (Light & Dark Modes)
The dashboard features an adaptive theme toggle button in the top-right corner. It detects your system's mode, allows seamless toggling between a futuristic dark cyber-aesthetic and a clean, high-contrast light mode, and persists your selection in browser local storage.

---

## 🗺️ Step-by-Step Refinement Pipeline

```
  [1. Paste Raw Notes] ──► [2. Analyze Specs] ──► [3. Slice Stories] ──► [4. Run Eng Loop] ──► [5. Export Backlog]
```

### Step 1: Spec Excavation (Input Phase)
This phase focuses on defining the exact scope of your feature to prevent "scope creep."

1.  **Select a Template or Enter Notes**:
    *   Click one of the **Quick Templates** (e.g., *User Filter Chips* or *Double Submit Protection*) to see an example, or paste your own messy notes into the **Raw Feature Notes** box.
    *   *Tip:* Selecting a quick template automatically pre-loads both the PO feature spec *and* the corresponding Lead Architect Design Doc.
2.  **Run the Excavator**:
    *   Click the **Analyze Spec (Excavator)** button.
    *   The Excavator agent will output a structured document under **Step 1: Excavator Synthesis Output** detailing:
        *   **Core Functional Requirements**: User actions, paths, and view transitions.
        *   **Non-Functional Requirements**: Performance constraints, security parameters, and state-management guidelines.
        *   **Missing Gaps**: Critical questions (e.g., character limits, DB history) to answer before writing tickets.
3.  **Review Gaps**: Take a moment to read the gaps flagged by the Excavator. Address them in your notes if necessary!

---

### Step 2: Slicing & Engineering Refinement (Agile & Engineering Gate)
This phase is where the PO's functional requirement meets the engineer's technical constraints.

#### Product Owner Slicing & Auditing
1.  **Run Slicer**:
    *   Click **Slice Into Stories (Slicer)**. The Slicer agent applies the SPIDR framework to generate micro user story cards.
2.  **Interact with Story Cards**:
    *   **Edit Title & Fields**: Click inside any card's text inputs to change the Title, **As A**, **I Want To**, or **So That** fields.
    *   **Acceptance Criteria**: Click **Add Rule** to write your own, edit existing ones, or click the Trash icon to delete them.
3.  **Adversary Stress Audit**:
    *   Click **Stress Test with Adversary** on a card to reveal **5 edge cases** custom-tailored to that story.
    *   Select the edge cases you want to safeguard and click **Apply Selected** to merge them straight into the card's Acceptance Criteria.

#### Engineering Technical Refinement
Toggle **Engineering Refinement Mode** ON at the top of Step 2 to open the bottom-up engineering gate:

1.  **Lead Architect Design Doc**:
    *   A shared panel appears displaying the architecture guidelines. You can write your own design doc, or click one of the quick buttons (e.g., *Use User Filter Chips Doc* or *Use Double Submit Protection Doc*) to load pre-loaded constraints.
2.  **Run Realist (Validation Gate)**:
    *   Click **Run Technical Refinement** on any card.
    *   The **Realist** agent audits the story against the Design Doc. If compatible, the pipeline proceeds. If conflicts are found (e.g., database schema mismatch), a warning panel flags the violations.
    *   You can edit the story to resolve the violation, or click **Override Warning & Decompose anyway** if the team agrees to proceed.
3.  **Decompose and Shield (Blueprinting & Shielding)**:
    *   Once validated (or overridden), the **Decomposer** and **Guardian** agents run automatically to generate an interactive glassmorphic subtask checklist inside the card.
4.  **Edit and Track Tasks**:
    *   Check off completed subtasks.
    *   Edit task titles, files affected, and developer steps.
    *   Modify or enrich the QA testing contracts (Unit, Integration, Mock Data) appended to each task.
    *   Click **+ Add Task** to add custom developer subtasks manually, or delete tasks using the `×` button.

---

### Step 3: Export & Backlog Release
Once your stories are sliced, customized, audited, and technical tasks are generated, they are ready for Jira, Linear, or GitHub.

1.  **Go to Release Center**:
    *   Navigate to **Step 3: Release Center** in the stepper HUD or click **Next: Export** at the bottom of Step 2.
2.  **Get Markdown**:
    *   Review the combined Markdown preview showing the requirements, vertical stories, and the complete developer subtask checklists and test contracts.
    *   Click **Copy Markdown** to copy the formatted text.
    *   Click **Download MD** to save a local `refined-backlog.md` file.

---

## 💡 Best Practices for Sprint Planning & Refinement

*   **PO & Dev Alignment**: Keep "Engineering Refinement Mode" toggled off when writing and discussing business stories with the Product Owner. Toggle it on once developers start mapping out files, DB schemas, and QA mock requirements.
*   **The Architect Gate**: Do not ignore warnings from **The Realist**. If it flags that an endpoint hasn't been built yet, or that a state manager violates conventions, use this to split a story into a backend prerequisite spike first.
*   **The Testing Contract**: Ensure the Guardian's unit and integration testing requirements are reviewed by QAs. The mock data specs generated can be copied directly to configure Mock Service Worker (MSW) or Cypress test suites.
