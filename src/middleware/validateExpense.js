// validateExpense.js — checks the data a user sends BEFORE we save it.
// Bad data (a negative amount, a missing category, a fake date...) is rejected
// with a clear 400 Bad Request message instead of being stored.
//
// Because this runs first, the controller can trust that any data reaching it
// is already good.

const CATEGORIES = require('../data/categories');

// Returns true if the text is a real calendar date written as YYYY-MM-DD.
function isValidDate(value) {
  // Step 1: it must be text that looks like 4 digits - 2 digits - 2 digits.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  // Step 2: it must be a date that really exists. JavaScript is forgiving:
  // "2026-02-30" parses to March 2, so we turn the date back into text and
  // check it still starts with what we were given. If it rolled over, it won't.
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// Check each field and collect every problem into a list.
// `partial` = true is used by PATCH, where fields are optional: a field is only
// checked if it was actually sent. For POST and PUT (partial = false) every
// required field must be present and valid.
function checkFields(body, partial) {
  const errors = [];
  const has = (field) => body[field] !== undefined; // was this field sent?

  // title: a non-empty piece of text, at most 100 characters.
  if (!partial || has('title')) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      errors.push('title is required and must be a non-empty string');
    } else if (body.title.trim().length > 100) {
      errors.push('title must be 100 characters or fewer');
    }
  }

  // amount: a real number bigger than zero (so no text, no NaN, no negatives).
  if (!partial || has('amount')) {
    if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
      errors.push('amount is required and must be a number greater than 0');
    }
  }

  // category: must be one of the allowed categories.
  if (!partial || has('category')) {
    if (!CATEGORIES.includes(body.category)) {
      errors.push(`category is required and must be one of: ${CATEGORIES.join(', ')}`);
    }
  }

  // date: a real calendar date in YYYY-MM-DD form.
  if (!partial || has('date')) {
    if (!isValidDate(body.date)) {
      errors.push('date is required and must be a valid date in YYYY-MM-DD format');
    }
  }

  // description is always optional, but if it's sent it must be text.
  if (has('description') && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }

  return errors;
}

// Builds an Express middleware function. Middleware runs between the request
// arriving and the controller handling it; calling next() passes it along.
// This is a function that RETURNS a function, which is why the routes write
// validateExpense() with brackets - they are calling the builder.
function validateExpense({ partial = false } = {}) {
  return (req, res, next) => {
    const body = req.body;

    // The body must be a JSON object like { ... } - not missing, not a list.
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a JSON object',
      });
    }

    // A PATCH that changes nothing makes no sense, so ask for at least one field.
    if (partial && Object.keys(body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update',
      });
    }

    // Run every check. If anything failed, stop here and list ALL the problems
    // at once, so the client can fix them in one go.
    const errors = checkFields(body, partial);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // All good - hand the request on to the controller.
    next();
  };
}

// isValidDate is exported too because the controller reuses it to check the
// startDate / endDate filters.
module.exports = { validateExpense, isValidDate };
