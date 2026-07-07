/**
 * Centralized Express error handler middleware.
 * Ensures all unhandled errors inside controllers bubble up and get returned
 * in a consistent, clean JSON structure instead of HTML pages or server traces.
 * 
 * @param {Error} err 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 */
export function errorHandler(err, req, res, next) {
  console.error("Centralized Error Caught:", err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected error occurred on the server.";

  const errorResponse = {
    error: message,
  };

  // Provide details only in development mode
  if (process.env.NODE_ENV !== "production" && err.stack) {
    errorResponse.details = {
      stack: err.stack,
      rawError: err,
    };
  }

  res.status(status).json(errorResponse);
}
