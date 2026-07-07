import { BATCH_SIZE } from "../config/constants.js";
import { extractCrmRecords } from "./ai.service.js";
import { validateAndSanitizeRecord } from "./validation.service.js";
import { chunkArray } from "../utils/chunk.js";

/**
 * Orchestrates the import workflow:
 * 1. Identifies unique CSV headers from the first row of data.
 * 2. Chunks the data rows into batches (configured size is 15).
 * 3. Sends each batch to the AI Service concurrently.
 * 4. Passes each AI-extracted record to the validation service to enforce business rules.
 * 5. Handles batch-level failures gracefully by moving those rows to the skipped array rather than failing the import.
 * 6. Merges and formats the results for the response.
 * 
 * @param {object[]} rows - The array of raw key-value objects parsed from the CSV.
 * @returns {Promise<object>} The aggregated import response.
 */
export async function importCsvData(rows) {
  if (!rows || rows.length === 0) {
    return {
      imported: [],
      skipped: [],
      total_imported: 0,
      total_skipped: 0,
    };
  }

  // Extract the headers from the keys of the first row
  const headers = Object.keys(rows[0]);
  console.log(`Starting import process for ${rows.length} rows with headers:`, headers);

  // Split into chunks of BATCH_SIZE (15)
  const batches = chunkArray(rows, BATCH_SIZE);
  console.log(`Split data into ${batches.length} batches of size ${BATCH_SIZE}.`);

  // Run all batches concurrently
  const batchPromises = batches.map(async (batchRows, index) => {
    try {
      // Map batch rows to include a tracking relative __row_index
      const batchRowsWithIndex = batchRows.map((row, i) => ({
        ...row,
        __row_index: i,
      }));

      // 1. Get AI extraction results for this batch
      const aiRecords = await extractCrmRecords(headers, batchRowsWithIndex);

      const imported = [];
      const skipped = [];

      // 2. Validate and sanitize each extracted record
      // Match the extracted AI output back to the raw input row using the relative __row_index
      for (let i = 0; i < batchRows.length; i++) {
        const rawRow = batchRows[i];
        
        // Look up by matching __row_index (loose comparison to handle strings vs numbers)
        const extractedRecord = aiRecords.find(
          (rec) => rec && (rec.__row_index == i)
        ) || aiRecords[i];

        if (!extractedRecord) {
          skipped.push({
            row: rawRow,
            reason: "AI failed to extract any record for this row index",
          });
          continue;
        }

        const validation = validateAndSanitizeRecord(extractedRecord);

        if (validation.isValid) {
          imported.push(validation.record);
        } else {
          skipped.push({
            row: rawRow,
            reason: validation.reason,
          });
        }
      }

      // If Gemini returned more records than input rows (unlikely but possible), validate them and append
      if (aiRecords.length > batchRows.length) {
        for (let i = batchRows.length; i < aiRecords.length; i++) {
          const validation = validateAndSanitizeRecord(aiRecords[i]);
          if (validation.isValid) {
            imported.push(validation.record);
          }
        }
      }

      return { imported, skipped };
    } catch (error) {
      console.error(`Batch ${index + 1} failed completely:`, error.message);
      
      // If a batch fails, we don't crash the whole import.
      // Every row in this batch is marked as skipped.
      const skipped = batchRows.map((row) => ({
        row,
        reason: `AI processing failed after retry: ${error.message}`,
      }));

      return { imported: [], skipped };
    }
  });

  const results = await Promise.all(batchPromises);

  // Accumulate results
  const importedList = [];
  const skippedList = [];

  for (const result of results) {
    importedList.push(...result.imported);
    skippedList.push(...result.skipped);
  }

  return {
    imported: importedList,
    skipped: skippedList,
    total_imported: importedList.length,
    total_skipped: skippedList.length,
  };
}
