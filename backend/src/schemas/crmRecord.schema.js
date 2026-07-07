import { z } from "zod";
import { ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES } from "../config/constants.js";

/**
 * Zod schema representing a single CRM record as returned by the AI extraction layer.
 * All fields are optional/nullable since the AI might not find them in the CSV.
 * Standard business rules (enums, skip criteria, multiple-value splits) are enforced
 * in the validation service layer rather than rejecting the schema entirely.
 */
export const crmRecordSchema = z.object({
  created_at: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  mobile_without_country_code: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  lead_owner: z.string().nullable().optional(),
  crm_status: z.string().nullable().optional(),
  crm_note: z.string().nullable().optional(),
  data_source: z.string().nullable().optional(),
  possession_time: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
