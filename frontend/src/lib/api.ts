import { type ImportResponse } from "~/types/crm";
import { API_CONFIG } from "~/config/api.config";

/**
 * Sends parsed CSV rows to the Express backend importer.
 * 
 * @param rows - Array of objects parsed from the CSV headers and cells.
 * @returns The structured API response from the server containing imported and skipped list.
 */
export async function sendCsvRowsToBackend(rows: Record<string, unknown>[]): Promise<ImportResponse> {
  const targetUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.import}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const errorMessage = errorJson?.error || `Request failed with status ${response.status} (${response.statusText})`;
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as ImportResponse;
    return data;
  } catch (error) {
    console.error("sendCsvRowsToBackend error:", error);
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        `Failed to connect to the backend server. Please verify that the API server is running and accessible at "${API_CONFIG.baseUrl}" and CORS is correctly configured.`
      );
    }
    throw error;
  }
}
