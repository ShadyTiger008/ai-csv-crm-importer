# AI CSV CRM Importer - Frontend Client

This directory contains the Next.js 15 App Router frontend application built using the T3 Stack template, Tailwind CSS, PapaParse, and TanStack Table.

## Core Architectural Decisions

### 1. The Three-Step Pipeline (Zero Server Costs on Browse)
A primary business constraint is preventing accidental API charges. The application uses a three-step flow:
1. **Upload & Local Parse**: The moment a user drags a CSV file, it is parsed **entirely in their browser** using a custom client-side PapaParse wrapper. The backend is never touched during this stage.
2. **Interactive Preview**: The user reviews the grid layout (columns and rows) in a TanStack Table.
3. **Confirm & AI Map**: Only when the user hits "Confirm Import" does the app send the rows payload to the `/api/import` endpoint. If the user cancels the preview, no LLM queries are executed.

---

### 2. State Machine encapsulated in a single hook (`useCsvImport`)
Instead of scattering wizard steps, file states, loading signals, and API results across five different presentational components, the entire wizard logic is controlled by a centralized state machine in `hooks/useCsvImport.ts`.

#### State Lifecycle Transitions
```text
      ┌───────────────┐
      │     UPLOAD    │   ◄──── (onReset / Cancel)
      └───────┬───────┘
              │  (onFileSelect -> PapaParse complete)
              ▼
      ┌───────────────┐
      │    PREVIEW    │
      └───────┬───────┘
              │  (onConfirmImport -> POST /api/import)
              ▼
      ┌───────────────┐
      │   IMPORTING   │   ◄──── (On HTTP Error -> keeps preview cache)
      └───────┬───────┘
              │  (API Response 200 OK)
              ▼
      ┌───────────────┐
      │    RESULTS    │
      └───────────────┘
```

By keeping the state in the hook, our UI elements (`UploadZone`, `PreviewTable`, `StatsBar`, `ResultsTable`) remain clean, stateless, and focused on layout styling.

---

### 3. Preserving Raw Strings (No Premature Browser Conversions)
Standard parser configurations often enable automatic number typing (`dynamicTyping: true`), which breaks data structures:
- Mobile numbers lose their leading zeros or plus signs (e.g., `+91 99999` becomes `9199999` or scientific floats).
- Multi-contact cells (like `email1, email2`) are distorted.

We set `dynamicTyping: false` and `skipEmptyLines: "greedy"` to preserve cell values as raw strings, giving the backend validator clean data to evaluate.

---

### 4. Grid Virtualization & DOM Speed
Rendering a table with 5,000 rows directly into the HTML DOM causes significant rendering lag. To maintain smooth UI interactions:
- The **Preview Table** slices and renders only the first 50 rows of the parsed sheet, but keeps the full dataset cached in React state for mapping on confirm.
- The **Results Table** uses scroll boundaries and layout virtualization to render lists efficiently.

---

## Environment Configuration

Configure your `.env` variables to direct calls to the Express server:
```text
NEXT_PUBLIC_API_URL=http://localhost:4000
```
This variable is validated at startup by `@t3-oss/env-nextjs` in `src/env.js`.
