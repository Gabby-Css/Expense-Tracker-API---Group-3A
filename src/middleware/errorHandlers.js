// errorHandlers.js - the "safety nets" at the end of the app.

// 1) notFound: runs when no route matched the URL, e.g. GET /api/banana
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// 2) errorHandler: runs when something throws an error anywhere in the app.
// Express knows this is an error handler because it has FOUR parameters.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Invalid JSON in the request body (e.g. a missing quote or comma).
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : 'Something went wrong on the server',
  });
}

module.exports = { notFound, errorHandler };