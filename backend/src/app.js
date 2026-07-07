import express from "express";
import cors from "cors";
import { requestLogger } from "./middlewares/requestLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import importRoutes from "./routes/import.routes.js";

const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for local development
app.use(cors({
  origin: "*", // In production, replace with specific frontend URL
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Use JSON body parser with increased limit (10MB) for handling larger CSV payloads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Attach logging middleware
app.use(requestLogger);

// Mount routes
app.use("/api", importRoutes);

// Catch-all 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Centralized error handler (must be registered last)
app.use(errorHandler);

export default app;
