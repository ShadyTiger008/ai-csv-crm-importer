import Papa from "papaparse";

export interface ParseCsvResult {
  data: Record<string, unknown>[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

/**
 * Parses a CSV file entirely in the browser using PapaParse.
 * Employs 'greedy' empty line skipping and disables dynamic typing
 * to preserve raw strings (e.g. phone numbers with + prefixes or leading zeros).
 * 
 * @param file - The HTML5 File object from drag/drop or file chooser.
 * @returns Promise resolving to parsed records and metadata.
 */
export function parseCsvClientSide(file: File): Promise<ParseCsvResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy", // skips lines containing only whitespace
      dynamicTyping: false,     // keep everything as strings so numbers/codes don't truncate
      complete: (results) => {
        // Filter out records that are completely empty or have no keys
        const cleanedData = results.data.filter(
          (row) => Object.values(row).some((val) => val !== null && String(val).trim() !== "")
        );
        resolve({
          data: cleanedData,
          errors: results.errors,
          meta: results.meta,
        });
      },
      error: (err) => {
        console.error("PapaParse error:", err);
        reject(err);
      },
    });
  });
}
