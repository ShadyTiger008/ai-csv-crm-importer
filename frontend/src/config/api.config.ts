import { env } from "~/env";

/**
 * Global API configurations for the CRM CSV Importer.
 * Serves as the single source of truth for base URLs and endpoints.
 */
export const API_CONFIG = {
  baseUrl: env.NEXT_PUBLIC_API_URL || "https://ai-csv-crm-importer.onrender.com",
  endpoints: {
    import: "/api/import",
  },
} as const;
