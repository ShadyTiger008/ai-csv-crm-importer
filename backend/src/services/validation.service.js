import { ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES } from "../config/constants.js";
import { crmRecordSchema } from "../schemas/crmRecord.schema.js";

/**
 * Normalizes and parses date strings.
 * Attempts to parse directly. If it fails, attempts to reformat DD/MM/YYYY or DD-MM-YYYY once.
 * 
 * @param {string} val - Raw date string.
 * @returns {string|null} ISO string or null.
 */
function normalizeDate(val) {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  // Try standard parsing
  let d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }

  // Attempt reformat: check for DD/MM/YYYY or DD-MM-YYYY
  const dmyRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  const match = trimmed.match(dmyRegex);
  if (match) {
    const [, day, month, year] = match;
    // Reformat to YYYY-MM-DD and try parsing again
    const reformatted = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    d = new Date(reformatted);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  return null;
}

/**
 * Validates and sanitizes a single extracted record based on the CRM business rules.
 * 
 * @param {object} rawRecord - The object returned by Gemini.
 * @returns {object} { isValid: boolean, record?: object, reason?: string }
 */
export function validateAndSanitizeRecord(rawRecord) {
  // 1. Run Zod parsing to clean up types
  const parsedResult = crmRecordSchema.safeParse(rawRecord);
  
  if (!parsedResult.success) {
    return {
      isValid: false,
      reason: `Zod structural validation failed: ${parsedResult.error.message}`,
    };
  }

  const record = parsedResult.data;
  let crm_note = record.crm_note ? record.crm_note.trim() : "";

  // 2. Extract unmapped properties from the raw input to prevent data loss
  const schemaKeys = new Set([
    "created_at", "name", "email", "country_code", "mobile_without_country_code",
    "company", "city", "state", "country", "lead_owner", "crm_status",
    "crm_note", "data_source", "possession_time", "description", "__row_index"
  ]);

  const extraItems = [];
  for (const [key, value] of Object.entries(rawRecord)) {
    if (!schemaKeys.has(key) && value !== null && value !== undefined && value !== "") {
      extraItems.push(`${key}: ${value}`);
    }
  }
  if (extraItems.length > 0) {
    const extraString = `Unmapped info: ${extraItems.join(", ")}`;
    crm_note = crm_note ? `${crm_note} | ${extraString}` : extraString;
  }

  // 3. Multi-email handling: use first, append rest to crm_note
  let email = record.email ? record.email.trim() : "";
  if (email) {
    const emails = email.split(/[,;\s|]+/).map(e => e.trim()).filter(Boolean);
    if (emails.length > 1) {
      email = emails[0];
      const secondaryEmails = emails.slice(1).join(", ");
      const emailNote = `Additional Emails: ${secondaryEmails}`;
      crm_note = crm_note ? `${crm_note} | ${emailNote}` : emailNote;
    }
  }

  // 4. Multi-phone handling: use first, append rest to crm_note
  let phone = record.mobile_without_country_code ? record.mobile_without_country_code.trim() : "";
  if (phone) {
    const phones = phone.split(/[,;\s|]+/).map(p => p.trim()).filter(Boolean);
    if (phones.length > 1) {
      phone = phones[0];
      const secondaryPhones = phones.slice(1).join(", ");
      const phoneNote = `Additional Phones: ${secondaryPhones}`;
      crm_note = crm_note ? `${crm_note} | ${phoneNote}` : phoneNote;
    }
  }

  // 5. Date normalization
  const created_at = record.created_at ? normalizeDate(record.created_at) : null;

  // 6. Enum validation: crm_status
  let crm_status = record.crm_status ? record.crm_status.trim() : null;
  if (crm_status && !ALLOWED_CRM_STATUSES.includes(crm_status)) {
    console.warn(`Invalid status '${crm_status}' found. Reverting to null.`);
    crm_status = null;
  }

  // 7. Enum validation: data_source
  let data_source = record.data_source ? record.data_source.trim() : null;
  if (data_source && !ALLOWED_DATA_SOURCES.includes(data_source)) {
    console.warn(`Invalid data source '${data_source}' found. Reverting to null.`);
    data_source = null;
  }

  // 8. Skip validation: A record is SKIPPED only if it has neither email nor mobile_without_country_code
  if (!email && !phone) {
    return {
      isValid: false,
      reason: "Lead possesses neither an email address nor a contact number (unactionable)",
    };
  }

  // Clean country code: trim pluses/whitespace
  const country_code = record.country_code ? record.country_code.trim() : null;

  const sanitizedRecord = {
    created_at,
    name: record.name ? record.name.trim() : null,
    email: email || null,
    country_code,
    mobile_without_country_code: phone || null,
    company: record.company ? record.company.trim() : null,
    city: record.city ? record.city.trim() : null,
    state: record.state ? record.state.trim() : null,
    country: record.country ? record.country.trim() : null,
    lead_owner: record.lead_owner ? record.lead_owner.trim() : null,
    crm_status,
    crm_note: crm_note || null,
    data_source,
    possession_time: record.possession_time ? record.possession_time.trim() : null,
    description: record.description ? record.description.trim() : null,
  };

  return {
    isValid: true,
    record: sanitizedRecord,
  };
}
