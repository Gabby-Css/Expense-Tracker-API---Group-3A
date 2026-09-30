// errorHandlers.js - the "safety nets" at the end of the app.
// They make sure the client always gets a clean JSON answer, even when
// something goes wrong, instead of an ugly default error page.

// 1) notFound: runs when no route matched the URL, e.g. GET /api/banana
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// 2) errorHandler: runs when something throws an error anywhere in the app.
// Express knows this is an error handler because it has FOUR parameters
// (err, req, res, next) - the extra "err" at the front is what gives it away.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Invalid JSON in the request body (e.g. a missing quote or comma).
  // This is the client's mistake, so we answer 400 with a friendly message.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  // Anything else is unexpected. Log the full error in the terminal for us to
  // read, but send the client only a safe, generic message so we never leak
  // technical details. If the error carries its own status, keep it.
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : 'Something went wrong on the server',
  });
}

module.exports = { notFound, errorHandler };
