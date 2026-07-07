import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { buildExtractionPrompt } from "../prompts/extraction.prompt.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

/**
 * Sends a batch of CSV rows to Gemini for CRM record extraction.
 * If JSON parsing fails, retries exactly once before bubbling up the error.
 * 
 * @param {string[]} headers - Raw CSV headers.
 * @param {object[]} rows - Batch of row objects (e.g. key-value objects or arrays).
 * @returns {Promise<object[]>} The array of extracted records.
 */
export async function extractCrmRecords(headers, rows) {
  const prompt = buildExtractionPrompt(headers, rows);
  let attempt = 1;
  const maxAttempts = 2;

  while (attempt <= maxAttempts) {
    try {
      console.log(`Sending batch of ${rows.length} rows to Gemini (Attempt ${attempt}/${maxAttempts})...`);
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // Instruct model to follow the structure we requested
          temperature: 0.1, // Keep it deterministic and factual
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response text from Gemini API.");
      }

      // Try to parse the response
      const parsedData = JSON.parse(responseText);
      
      if (!Array.isArray(parsedData)) {
        throw new Error("Gemini response is not a JSON array.");
      }

      return parsedData;
    } catch (error) {
      console.warn(`Attempt ${attempt} failed to parse Gemini response:`, error.message);
      if (attempt === maxAttempts) {
        throw new Error(`AI extraction failed after ${maxAttempts} attempts: ${error.message}`);
      }
      attempt++;
    }
  }
}
