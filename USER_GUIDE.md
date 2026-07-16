# AI Refinement Matrix - User Guide

Welcome to the **AI Refinement Matrix Dashboard**! This guide walks you through how to use the dashboard to turn vague, messy product requirements into highly specific, vertically-sliced, and security-hardened user stories ready for execution.

---

## 🌟 Overview of the Team

The dashboard orchestrates three specialized AI agent personas that correspond to key roles in a backlog refinement process:

1.  **The Excavator (Systems Architect)**: Mines raw notes to separate *what* the system does (functional) from *how* it behaves (non-functional), while flagging logical gaps.
2.  **The Slicer (Agile Coach)**: Splits specifications into the smallest possible end-to-end vertical slices using the **SPIDR framework**.
3.  **The Adversary (QA Lead & Security Engineer)**: A professional cynic that stress-tests your stories to find race conditions, security flaws, and offline errors.

---

## 🏃 Quick Start: Launching the Dashboard

To launch the application locally, open your terminal and run:

```bash
cd ~/GitHub/ai-refinement-matrix
npm run dev
```

Then, open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.

---

## 🗺️ Step-by-Step Refinement Pipeline

```
  [1. Paste Raw Notes] ──► [2. Analyze Specs] ──► [3. Slice Stories] ──► [4. Stress Test] ──► [5. Export Backlog]
```

### Step 1: Spec Excavation (Input Phase)
This phase focuses on defining the exact scope of your feature to prevent "scope creep."

1.  **Select a Template or Enter Notes**:
    *   Click one of the **Quick Templates** (e.g., *User Filter Chips* or *Double Submit Protection*) to see an example, or paste your own messy notes, user feedback, or Slack messages into the **Raw Feature Notes** box.
2.  **Run the Excavator**:
    *   Click the **Analyze Spec (Excavator)** button.
    *   The Excavator agent will output a structured document under **Step 1: Excavator Synthesis Output** detailing:
        *   **Core Functional Requirements**: User actions, paths, and view transitions.
        *   **Non-Functional Requirements**: Performance constraints, security parameters, and state-management guidelines.
        *   **Missing Gaps**: Critical questions (e.g., character limits, DB history) to answer before writing tickets.
3.  **Review Gaps**: Take a moment to read the gaps flagged by the Excavator. Address them in your notes if necessary!

---

### Step 2: Slicing into User Stories (Agile Slicing)
This phase splits your broad requirement into small, vertically integrated cards (spanning database to frontend) so they can be developed and shipped incrementally.

1.  **Run Slicer**:
    *   Click **Slice Into Stories (Slicer)**.
    *   The Slicer agent applies the SPIDR framework to generate micro user story cards.
2.  **Interact with Story Cards**:
    *   **Edit Title & Fields**: Click inside any card's text inputs to change the Title, **As A**, **I Want To**, or **So That** fields.
    *   **Acceptance Criteria**: Each card generates Given-When-Then rules. You can edit existing rules, click **Add Rule** to write your own, or click the Trash icon to remove rules.
    *   **Rearrange & Delete**: Click the Trash icon at the top right of a card to delete stories that aren't needed, or click **Add Slice** at the top of the list to create a new card manually.

---

### Step 3: Cynical Stress Audit (The Adversary Phase)
Most bugs happen on the "sad path" (network dropouts, double-clicks, input injections). This phase hardens your stories.

1.  **Trigger the Adversary**:
    *   On any story card you want to test, click the red **Stress Test with Adversary** button.
    *   A dialog overlay will appear while the Adversary agent scans your story parameters.
2.  **Audit the Edge Cases**:
    *   The Adversary displays **5 obscure edge cases** custom-tailored to that specific card (e.g., race conditions, XSS, database timeouts).
    *   Each edge case shows an explanation and concrete Given-When-Then acceptance criteria to fix it.
3.  **Merge Safeguards**:
    *   Select the checkboxes for the edge cases you want to address.
    *   Click **Apply Selected**. The edge cases and their safety criteria will be appended directly to your story card's Acceptance Criteria list!

---

### Step 4: Export & Backlog Release
Once your stories are sliced, customized, and audited, they are ready for Jira, Linear, or GitHub Issues.

1.  **Go to Release Center**:
    *   Navigate to **Step 3: Release Center** in the stepper HUD or click **Next: Export** at the bottom of Step 2.
2.  **Get Markdown**:
    *   Review the combined Markdown preview showing the requirements analysis and all vertical story slices.
    *   Click **Copy Markdown** to copy the formatted text to your clipboard.
    *   Click **Download MD** to save a local `refined-backlog.md` file.

---

## 💡 Best Practices for Sprint Planning & Refinement

*   **The 10-Minute Pre-Pass**: Before your refinement meeting begins, run your raw ideas through Step 1 and Step 2. Having 4-5 micro-tickets ready for review saves your team from staring at blank ticket forms.
*   **Dev Team Review**: During the meeting, have the team read through the Slicer's cards. If developers feel a card is "too big" or spans too many unknowns, click **Add Slice** to break it down further.
*   **The Cynic Check**: Always run the Adversary on complex user stories (like checkouts, forms, filters, or API integrations). It generates QA criteria instantly, saving hours of manual test case writing later.
*   **Keep Slices Vertical**: Ensure every card contains frontend, backend, and data rules. Avoid creating "frontend-only" or "backend-only" tickets.
