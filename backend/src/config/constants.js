/**
 * System-wide constants for the CRM importer.
 * Isolating enums and configurations here ensures we have a single source of truth
 * for validation schemas, prompts, and business logic checkers.
 */

export const BATCH_SIZE = 15;

export const ALLOWED_CRM_STATUSES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

export const ALLOWED_DATA_SOURCES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];
