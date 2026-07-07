import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PORT = parseInt(process.env.PORT || "4000", 10);

if (!GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not defined.");
  console.error("Please create a .env file in the /backend directory and add GEMINI_API_KEY.");
  process.exit(1);
}

if (!GROQ_API_KEY) {
  console.warn("WARNING: GROQ_API_KEY is not defined. Fallback to Groq will not be available.");
}

if (!OPENROUTER_API_KEY) {
  console.warn("WARNING: OPENROUTER_API_KEY is not defined. Fallback to Open Router will not be available.");
}

export const env = {
  GEMINI_API_KEY,
  GROQ_API_KEY,
  OPENROUTER_API_KEY,
  PORT,
};
