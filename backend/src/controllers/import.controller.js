import { importCsvData } from "../services/csvImport.service.js";

/**
 * Handles incoming POST requests to /api/import.
 * Validates request payload and delegates processing to the import service.
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 */
export async function handleImport(req, res, next) {
  try {
    const { rows } = req.body;

    // Validate structure of input payload
    if (!rows) {
      return res.status(400).json({
        error: "Missing required 'rows' field in request body",
      });
    }

    if (!Array.isArray(rows)) {
      return res.status(400).json({
        error: "Invalid request format: 'rows' must be a JSON array",
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({
        error: "CSV file appears to be empty. No rows found to import.",
      });
    }

    console.log(`Received import request for ${rows.length} rows.`);
    const result = await importCsvData(rows);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error inside handleImport controller:", error);
    next(error);
  }
}
