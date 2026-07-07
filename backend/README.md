# AI CSV CRM Importer - Backend Service

This directory houses the Node.js / Express backend service that handles raw row processing, AI mapping, schema extraction, and business rule enforcement.

## Why this Architecture?

Instead of writing a single "fat" script or mixing API routing with LLM prompt configuration, this project uses a strict **Layered Architecture**. Each component has a single, isolated responsibility, making the system easy to test, trace, and maintain:

1. **Bootstrap (`index.js`)**: Purely initializes the HTTP listener and handles process signals (SIGINT/SIGTERM) for graceful shutdowns.
2. **Setup (`app.js`)**: Registers core middleware (CORS, body parser size limits to handle large uploads, request logging) and defines routing bounds.
3. **Routing (`routes/import.routes.js`)**: Bare mapping of URI pathways to controller functions. Contains no logic.
4. **Controllers (`controllers/import.controller.js`)**: Sanitizes HTTP input structures, validates the presence of raw parameters, and returns responses.
5. **Orchestration Service (`services/csvImport.service.js`)**: Handles batching, executes calls in parallel, maps AI outputs back to raw rows, and aggregates counts.
6. **AI Service (`services/ai.service.js`)**: Focuses on communicating with the AI models via a multi-provider fallback orchestrator, parsing structured JSON, and managing API retries/cooldowns.
7. **Validation Service (`services/validation.service.js`)**: Holds Zod validation rules and checks records against granular business rules.
8. **Prompt Builder (`prompts/extraction.prompt.js`)**: Builds prompt templates, few-shot examples, and embeds CSV headers dynamically to maximize the context-reasoning capability of the model.

---

## Request Lifecycle Flow Chart

```text
[Client POST /api/import]
          │
          ▼
   [import.routes.js]  (Router definition)
          │
          ▼
 [import.controller.js] (Checks for 'rows' payload, manages req/res)
          │
          ▼
[csvImport.service.js]  (Chunks rows into batches of 15; maps parallel promises)
          │
      ┌───┴──────────────────────────────────────┐
      ▼ (Concurrent Batches)                     ▼ (Concurrent Batches)
 [ai.service.js]                            [ai.service.js]
  - Runs multi-provider fallback chain       - Runs multi-provider fallback chain
    (Gemini ➔ Groq ➔ OpenRouter)               (Gemini ➔ Groq ➔ OpenRouter)
  - Retries each provider up to 2 times      - Retries each provider up to 2 times
  - 2.5s delay backoff between retries       - 2.5s delay backoff between retries
      │                                          │
      ▼                                          ▼
[validation.service.js]                    [validation.service.js]
  - Zod structural validation                - Zod structural validation
  - Normalizes created_at dates              - Normalizes created_at dates
  - Splits multiple emails/phones            - Splits multiple emails/phones
  - Checks status/source enums               - Checks status/source enums
  - Skip rule (no email AND no phone)        - Skip rule (no email AND no phone)
      │                                          │
      └──────────────────┬───────────────────────┘
                         ▼
             [csvImport.service.js]
              - Aggregates batch totals (imported & skipped lists)
              - Returns payload to controller
```

---

## Batching, Resilience & Error Handling

### 1. Chunking to Size 15
A batch size of **15** is the sweet spot. It is small enough that if an input row is highly malformed or contains unexpected characters that break the model's parser, we only lose at most 15 leads in that batch (or retry them), rather than breaking a 500-lead import. It is also large enough to avoid making dozens of individual API requests (which would exhaust rate limits and run slowly).

### 2. High-Availability Multi-Provider Fallback (Production Gate)
To insulate our importer from external LLM outages, rate limits (`429`), or API quota issues, the system uses a tiered fallback orchestrator:
1. **Primary Model:** Gemini 2.0 Flash (official `@google/genai` SDK)
2. **Secondary Model:** Groq (`llama-3.3-70b-versatile` via direct HTTP endpoints)
3. **Tertiary Model:** OpenRouter (`openrouter/free` load balancer model via direct HTTP endpoints)

For each batch, the system attempts to extract the CRM data from the primary provider. If the request fails or returns invalid JSON:
* It waits for **2.5 seconds** (cooling down transient rate limits) and attempts the request with Gemini a second time.
* If the second attempt fails, it cascades to Groq and attempts the request up to **2 times** (with a 2.5s cooldown).
* If Groq fails, it cascades to OpenRouter and tries it up to **2 times** (with a 2.5s cooldown).
* Only if all 3 providers (6 total attempts) fail does the batch fail completely, executing the graceful degradation skip handler.

### 3. Graceful Batch Degradation
If a batch fails completely (e.g., rate limits hit, network drop, or Gemini fails twice in a row), we catch that exception at the batch level. The backend **does not crash** and does not fail the whole import. Instead, all 15 rows from that batch are immediately appended to the `skipped` list with a reason detailed as `"AI processing failed after retry"`. This allows other batches to succeed and gives the user their partial import results.

### 4. Date Normalization & Multi-Contact Sorting
Rather than relying on the LLM to format dates and split values, the validation service handles this deterministically:
- Dates matching `DD/MM/YYYY` or `DD-MM-YYYY` formats (which fail JS standard parsing) are automatically reformatted to `YYYY-MM-DD` and verified. If they are still invalid, the field is cleared (`null`), but the record is **kept**.
- If multiple emails or phone numbers are squeezed into a single cell, the first is extracted as the main value, and the subsequent ones are parsed and appended to `crm_note` to ensure zero information loss.
- Records lacking both an email and a phone number are filtered to `skipped` with a clear contact-missing explanation.

---

## Known Limitations

- **Concurrency Rate Limits**: For files with 2,000+ rows, running `Promise.all` directly on 130+ batches concurrently could hit Gemini API concurrent request or RPM (Requests Per Minute) limits. In a true enterprise-scale deployment, this would be throttled using a concurrency queue (like `p-limit`) or handled asynchronously using background jobs with webhooks.
- **Ambiguous Column Name Tracing**: If a user uploads a column named "Data" or "Info" containing a mix of notes and other values, the model will attempt its best translation. However, if there are no helper values, it might drop it into `crm_note`.
