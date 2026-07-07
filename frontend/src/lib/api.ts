import { type ImportResponse } from "~/types/crm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Sends parsed CSV rows to the Express backend importer.
 * 
 * @param rows - Array of objects parsed from the CSV headers and cells.
 * @returns The structured API response from the server containing imported and skipped list.
 */
export async function sendCsvRowsToBackend(rows: Record<string, unknown>[]): Promise<ImportResponse> {
  try {
    const response = await fetch(`${API_URL}/api/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const errorMessage = errorJson?.error || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as ImportResponse;
    return data;
  } catch (error) {
    console.error("sendCsvRowsToBackend error:", error);
    throw error;
  }
}
