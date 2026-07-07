import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = parseInt(process.env.PORT || "4000", 10);

if (!GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not defined.");
  console.error("Please create a .env file in the /backend directory and add GEMINI_API_KEY.");
  process.exit(1);
}

export const env = {
  GEMINI_API_KEY,
  PORT,
};
