import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { buildExtractionPrompt } from "../prompts/extraction.prompt.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Clean markdown wrapper blocks and parse the JSON.
 * Gracefully extracts arrays even if wrapped in a top-level object.
 * 
 * @param {string} text - Raw string response from the AI.
 * @returns {object[]} Parsed CRM record objects.
 */
export function cleanAndParseJson(text) {
  let cleaned = text.trim();
  
  // Remove markdown code block fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/```$/, "").trim();
  }
  
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseError) {
    // Attempt recovery by locating boundaries of [ or {
    const startIdxArray = cleaned.indexOf("[");
    const startIdxObj = cleaned.indexOf("{");
    
    let startIndex = -1;
    let endIndex = -1;
    
    if (startIdxArray !== -1 && (startIdxObj === -1 || startIdxArray < startIdxObj)) {
      startIndex = startIdxArray;
      endIndex = cleaned.lastIndexOf("]");
    } else if (startIdxObj !== -1) {
      startIndex = startIdxObj;
      endIndex = cleaned.lastIndexOf("}");
    }
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const jsonSubstring = cleaned.substring(startIndex, endIndex + 1);
      parsed = JSON.parse(jsonSubstring);
    } else {
      throw new Error(`JSON parsing failed: ${parseError.message}. Content was: ${cleaned}`);
    }
  }
  
  // If parsed object is directly an array, return it
  if (Array.isArray(parsed)) {
    return parsed;
  }
  
  // If parsed object is a JSON object wrapper, try to extract the first nested array
  if (parsed && typeof parsed === "object") {
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) {
        return parsed[key];
      }
    }
  }
  
  throw new Error("AI extraction did not return a JSON array containing records.");
}

/**
 * Query Gemini via Google Gen AI SDK
 */
async function queryGemini(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });
  return response.text;
}

/**
 * Query Groq API via standard Fetch HTTP Request (OpenAI compatible)
 */
async function queryGroq(prompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API returned HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

/**
 * Query Open Router API via standard Fetch HTTP Request (OpenAI compatible)
 */
async function queryOpenRouter(prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AI CSV CRM Importer",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Open Router API returned HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

/**
 * Sends a batch of CSV rows to Gemini for CRM record extraction.
 * Integrates retry attempts (2 per service) and fallbacks to Groq and Open Router.
 * 
 * @param {string[]} headers - Raw CSV headers.
 * @param {object[]} rows - Batch of row objects.
 * @returns {Promise<object[]>} The array of extracted records.
 */
export async function extractCrmRecords(headers, rows) {
  const prompt = buildExtractionPrompt(headers, rows);
  
  const providers = [
    { name: "Gemini", queryFn: queryGemini, enabled: !!env.GEMINI_API_KEY },
    { name: "Groq", queryFn: queryGroq, enabled: !!env.GROQ_API_KEY },
    { name: "Open Router", queryFn: queryOpenRouter, enabled: !!env.OPENROUTER_API_KEY },
  ];

  let lastError = null;

  for (const provider of providers) {
    if (!provider.enabled) {
      console.log(`Skipping provider ${provider.name} - API key not configured.`);
      continue;
    }

    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Sending batch of ${rows.length} rows to ${provider.name} (Attempt ${attempt}/${maxAttempts})...`);
        const text = await provider.queryFn(prompt);
        if (!text) {
          throw new Error(`Empty response returned from ${provider.name}`);
        }

        const parsedData = cleanAndParseJson(text);
        console.log(`Successfully extracted ${parsedData.length} records using ${provider.name}!`);
        return parsedData;
      } catch (error) {
        lastError = error;
        console.warn(`[WARNING] Attempt ${attempt} using ${provider.name} failed: ${error.message}`);
        
        if (attempt < maxAttempts) {
          const waitTime = 2500; // wait 2.5 seconds
          console.log(`Waiting ${waitTime / 1000}s before retrying ${provider.name}...`);
          await sleep(waitTime);
        }
      }
    }
    console.warn(`[ERROR] ${provider.name} failed after ${maxAttempts} attempts. Transitioning to next fallback...`);
  }

  throw new Error(`AI extraction failed across all providers. Final error: ${lastError.message}`);
}
