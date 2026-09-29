// validateExpense.js — checks the data a user sends BEFORE we save it.
// Bad data (a negative amount, a missing category, a fake date...) is rejected
// with a clear 400 Bad Request message instead of being stored.

const CATEGORIES = require('../data/categories');
// Returns true if the text is a real calendar date written as YYYY-MM-DD.
function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  // "2026-02-30" parses to March 2, so check the date didn't roll over.
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// Check each field. `partial` = true is used by PATCH, where fields are optional.
function checkFields(body, partial) {
  const errors = [];
  const has = (field) => body[field] !== undefined;

  if (!partial || has('title')) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      errors.push('title is required and must be a non-empty string');
    } else if (body.title.trim().length > 100) {
      errors.push('title must be 100 characters or fewer');
    }
  }

  if (!partial || has('amount')) {
    if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
      errors.push('amount is required and must be a number greater than 0');
    }
  }

  if (!partial || has('category')) {
    if (!CATEGORIES.includes(body.category)) {
      errors.push(`category is required and must be one of: ${CATEGORIES.join(', ')}`);
    }
  }

  if (!partial || has('date')) {
    if (!isValidDate(body.date)) {
      errors.push('date is required and must be a valid date in YYYY-MM-DD format');
    }
  }

  // description is always optional.
  if (has('description') && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }

  return errors;
}

// Builds an Express middleware function. Middleware runs between the request
// arriving and the controller handling it; calling next() passes it along.
function validateExpense({ partial = false } = {}) {
  return (req, res, next) => {
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a JSON object',
      });
    }

    if (partial && Object.keys(body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update',
      });
    }

    const errors = checkFields(body, partial);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    next();
  };
}

module.exports ={ validateExpense, isValidDate };



