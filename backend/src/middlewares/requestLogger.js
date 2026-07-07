/**
 * A clean, lightweight request logging middleware.
 * Traces the HTTP method, URL, response status, and duration of all calls.
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Listen to response finish event to capture duration
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`[HTTP] ${method} ${originalUrl} - Status: ${statusCode} in ${duration}ms`);
  });

  next();
}
