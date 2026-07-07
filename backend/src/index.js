import app from "./app.js";
import { env } from "./config/env.js";

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log("=========================================");
  console.log(`  CRM IMPORTER SERVER INITIALIZED`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("=========================================");
});

// Handle graceful shutdown signals
const handleGracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully stopping Express server...`);
  server.close(() => {
    console.log("HTTP server closed. Exiting process.");
    process.exit(0);
  });
};

process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));
process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
