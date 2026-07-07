# AI CSV CRM Importer (Monorepo)

A production-grade, full-stack monorepo that maps messy, unstructured CSV spreadsheets into standardized, validated CRM contacts. Powered by **Express**, **Gemini 2.0 Flash**, and **Next.js 15 (T3 Stack)**.

---

## 📂 Project Structure

This project is organized as a monorepo containing two main applications:

*   **[`/backend`](./backend)**: Node.js & Express REST API. Utilizes the official `@google/genai` SDK for LLM extraction, and Zod schemas for structural schema checking.
*   **[`/frontend`](./frontend)**: Next.js 15 client built on the T3 Stack. Handles browser-side CSV reading (via PapaParse) and responsive scrollable grid views (via TanStack Table).

---

## ⚡ Prerequisites

*   **Node.js**: `v18.x` or higher
*   **NPM**: `v9.x` or higher
*   **Gemini API Key**: Obtain a key from the [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 Quick Start Guide

Follow these steps to run both the backend and frontend servers locally:

### 1. Set Up Backend Environment variables
Create a `.env` file inside the `backend/` directory (or modify the template we created for you):
```bash
# In backend/.env
PORT=4000
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies
Dependencies have already been installed for both workspaces. If you ever need to re-install, run:
- In `backend/`: `npm install`
- In `frontend/`: `npm install`

### 3. Run Development Servers
You can run both systems from the root workspace directory using our mapped scripts:

*   **Start the Express API Server** (runs on `http://localhost:4000`):
    ```bash
    npm run dev:backend
    ```
*   **Start the Next.js Client Application** (runs on `http://localhost:3000`):
    ```bash
    npm run dev:frontend
    ```

---

## 🛠️ The Import Pipeline

Our application is designed to prevent unnecessary LLM costs and ensure high data reliability:

```text
 [1. Select CSV File]       ───►  Parses client-side using PapaParse
                                  (No server API request/cost yet)
          │
          ▼
 [2. Review Layout]         ───►  Displays raw rows in TanStack Grid
          │
          ▼ (Confirm Import)
 [3. Concurrent Batching]   ───►  POSTs payload to API; backend chunks data
                                  into batches of 15, executing parallel LLM calls
          │
          ▼
 [4. Validation Gate]       ───►  Zod matches CRM schema; validates enums,
                                  normalizes dates, splits emails/phones,
                                  and filters out contacts lacking channels
          │
          ▼
 [5. Results Dashboard]     ───►  Displays interactive stats and categorized tables
                                  (Imported vs. Skipped)
```

For detailed notes on each component's internals, see the individual readmes:
*   [Backend Technical Details](./backend/README.md)
*   [Frontend Technical Details](./frontend/README.md)
