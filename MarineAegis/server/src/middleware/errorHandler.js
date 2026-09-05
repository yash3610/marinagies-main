export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const status = error.status || error.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Something went wrong on the server." : error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  });
}
