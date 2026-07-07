import { ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES } from "../config/constants.js";

/**
 * Builds the prompt string sent to Gemini to extract CRM records from a batch of CSV rows.
 * 
 * @param {string[]} headers - The actual headers present in the uploaded CSV.
 * @param {object[]} rows - The batch of raw rows to be parsed.
 * @returns {string} The formatted prompt.
 */
export function buildExtractionPrompt(headers, rows) {
  return `You are a data extraction assistant. Your job is to parse a batch of raw records from a CSV file (with the headers specified below) and map them to our structured CRM schema.

Here is our exact CRM Schema:
- created_at: Date when the lead was created. Output in an ISO-parseable date format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ).
- name: Full name of the lead.
- email: Primary email address. If multiple emails exist, put the first here, and append the others to 'crm_note'.
- country_code: Dialing code of the phone (e.g., +1, +91).
- mobile_without_country_code: Mobile number without country dialing code. If multiple phones exist, put the first here, and append the others to 'crm_note'.
- company: Organization or business name.
- city: City location.
- state: State or province.
- country: Country name.
- lead_owner: Person assigned to manage this lead.
- crm_status: The status of the lead. MUST be exactly one of: [${ALLOWED_CRM_STATUSES.join(", ")}]. If the status in the row does not match these, or if you are not confident, return null. Do not invent statuses.
- crm_note: General notes, remarks, or unmapped data. If there are extra columns or data that do not fit elsewhere, merge them into this note.
- data_source: Origin of the lead. MUST be exactly one of: [${ALLOWED_DATA_SOURCES.join(", ")}]. If it does not confidently match one of these, return null.
- possession_time: Ideal time or details about when they want possession/service.
- description: Additional details or requirements.

Strict Business Rules:
1. Multi-Email/Phone Rule: If a row contains multiple email addresses or phone numbers, extract the first one as the primary field, and append the rest to 'crm_note' in the format "Additional Emails: [list]" or "Additional Phones: [list]".
2. Enum Strictness: For crm_status and data_source, you must only return the exact allowed enum strings. If the value in the CSV is ambiguous, missing, or doesn't match, return null.
3. Unmapped Data: If there are columns in the CSV that have data but do not have a dedicated field in the schema (e.g., "Budget", "Preferences"), summarize them in 'crm_note' so they are not lost.
4. Output format: Return ONLY a raw JSON array of objects. Do not wrap in markdown code blocks like \`\`\`json ... \`\`\`. Do not include any pre-amble, explanation, or post-amble. Return exactly: [ { ... }, { ... } ]

Below are 3 few-shot examples demonstrating how to perform this extraction:

===
EXAMPLE 1: Standard Clean Headers
Input Headers: ["Created Date", "Full Name", "Email Address", "Phone Number", "Company Name", "City", "State", "Country", "Lead Owner", "Status", "Source"]
Input Row: ["2023-10-15", "John Doe", "john@example.com", "+1 1234567890", "Acme Corp", "San Francisco", "California", "USA", "Alice Smith", "GOOD_LEAD_FOLLOW_UP", "leads_on_demand"]
Output JSON:
[
  {
    "created_at": "2023-10-15",
    "name": "John Doe",
    "email": "john@example.com",
    "country_code": "+1",
    "mobile_without_country_code": "1234567890",
    "company": "Acme Corp",
    "city": "San Francisco",
    "state": "California",
    "country": "USA",
    "lead_owner": "Alice Smith",
    "crm_status": "GOOD_LEAD_FOLLOW_UP",
    "crm_note": null,
    "data_source": "leads_on_demand",
    "possession_time": null,
    "description": null
  }
]

===
EXAMPLE 2: Messy/Ambiguous Headers & Unmatched Enums
Input Headers: ["Date", "Name", "Mail", "Ph No", "Firm", "Owner", "Status", "Budget", "Interest"]
Input Row: ["15-Oct-2023", "Jane Smith", "jane@example.com", "9876543210", "Beta LLC", "Bob Jones", "Warm Lead", "$50k", "SaaS Software"]
Output JSON:
[
  {
    "created_at": "2023-10-15",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "country_code": null,
    "mobile_without_country_code": "9876543210",
    "company": "Beta LLC",
    "city": null,
    "state": null,
    "country": null,
    "lead_owner": "Bob Jones",
    "crm_status": null,
    "crm_note": "Budget: $50k. Interest: SaaS Software.",
    "data_source": null,
    "possession_time": null,
    "description": null
  }
]

===
EXAMPLE 3: Multiple Emails & Phone Numbers
Input Headers: ["Name", "Contact Emails", "Phones", "Source", "Project"]
Input Row: ["Bob Miller", "bob@gmail.com; bob.miller@work.com", "+91 9999999999 / +91 8888888888", "eden_park", "Villa Project"]
Output JSON:
[
  {
    "created_at": null,
    "name": "Bob Miller",
    "email": "bob@gmail.com",
    "country_code": "+91",
    "mobile_without_country_code": "9999999999",
    "company": null,
    "city": null,
    "state": null,
    "country": null,
    "lead_owner": null,
    "crm_status": null,
    "crm_note": "Additional Emails: bob.miller@work.com. Additional Phones: +91 8888888888. Project: Villa Project.",
    "data_source": "eden_park",
    "possession_time": null,
    "description": null
  }
]
===

Now, process this actual batch of rows:
Actual CSV Headers: ${JSON.stringify(headers)}
Actual Batch Rows Data: ${JSON.stringify(rows)}

Output JSON:`;
}
