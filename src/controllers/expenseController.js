// expenseController.js - the actual logic for each endpoint.
// Every function receives (req, res): the incoming request and the response
// we use to answer it.
//
// Think of the controller as the chef: by the time a request gets here, the
// router has picked the right function and the validator has already checked
// that the data is good.
//
// Every change follows the same pattern:
//   read all expenses -> change the array in memory -> write it all back.

const crypto = require('crypto');
const { readAll, writeAll } = require('../data/db');
const CATEGORIES = require('../data/categories');
const { isValidDate } = require('../middleware/validateExpense');

// ---------------------------------------------------------------------------
// Helpers (small tools the endpoints below share)
// ---------------------------------------------------------------------------

// Round money to 2 decimal places, e.g. 35.678 -> 35.68.
// Trick: multiply by 100, round to a whole number, divide by 100 again.
const round2 = (n) => Math.round(n * 100) / 100;

// Only copy the fields we allow, so users can't sneak in extra data
// (like overwriting "id" or "createdAt"). It also tidies what it copies:
// spaces around the title/description are trimmed and the amount is rounded.
function pickFields(body) {
  const fields = {};
  if (body.title !== undefined) fields.title = body.title.trim();
  if (body.amount !== undefined) fields.amount = round2(body.amount);
  if (body.category !== undefined) fields.category = body.category;
  if (body.date !== undefined) fields.date = body.date;
  if (body.description !== undefined) fields.description = body.description.trim();
  return fields;
}

// Apply the date / category filters shared by the list and summary endpoints.
// Returns { expenses } on success or { error } if a query value is invalid.
// (Writing it once here means the two endpoints can't drift apart.)
function applyFilters(expenses, query) {
  const { category, startDate, endDate } = query;

  // First make sure the filter values make sense...
  if (category && !CATEGORIES.includes(category)) {
    return { error: `category must be one of: ${CATEGORIES.join(', ')}` };
  }
  if (startDate && !isValidDate(startDate)) return { error: 'startDate must be YYYY-MM-DD' };
  if (endDate && !isValidDate(endDate)) return { error: 'endDate must be YYYY-MM-DD' };

  // ...then keep only the expenses that match. A filter that wasn't given is
  // simply skipped: (!category || ...) means "no category filter? let it through".
  // YYYY-MM-DD strings compare correctly as plain text, so no Date objects needed.
  const result = expenses.filter(
    (e) =>
      (!category || e.category === category) &&
      (!startDate || e.date >= startDate) &&
      (!endDate || e.date <= endDate)
  );
  return { expenses: result };
}


// ---------------------------------------------------------------------------
// CREATE - POST /api/expenses
// ---------------------------------------------------------------------------

function createExpense(req, res) {
  const expenses = readAll();
  const now = new Date().toISOString();

  // Build the new expense. Later lines win, so:
  //  - description starts as '' but is replaced if the client sent one,
  //  - id and the timestamps are always set by the SERVER, never the client.
  const expense = {
    id: crypto.randomUUID(), // a unique ID like "3f1c9a2e-..."
    description: '',
    ...pickFields(req.body),
    createdAt: now,
    updatedAt: now,
  };

  expenses.push(expense);
  writeAll(expenses);

  // 201 Created is the correct status code when something new is made.
  res.status(201).json({ success: true, message: 'Expense created', data: expense });
}


// ---------------------------------------------------------------------------
// READ ALL - GET /api/expenses
// Optional query params: category, startDate, endDate, minAmount, maxAmount,
// search, sort, page, limit
// The steps run in this order: filter -> search -> sort -> totals -> paginate.
// ---------------------------------------------------------------------------

function getExpenses(req, res) {
  // Step 1: category and date filters (shared helper).
  const filtered = applyFilters(readAll(), req.query);
  if (filtered.error) return res.status(400).json({ success: false, message: filtered.error });
  let expenses = filtered.expenses;

  const { minAmount, maxAmount, search, sort = '-date' } = req.query;

  // A repeated query key (?sort=a&sort=b) arrives as an array, not a string.
  if (typeof sort !== 'string') {
    return res.status(400).json({ success: false, message: 'sort must be a single value' });
  }

  // Step 2: amount range. Query values arrive as text, so convert to a number
  // first and reject anything that isn't one.
  if (minAmount !== undefined) {
    const min = Number(minAmount);
    if (Number.isNaN(min)) return res.status(400).json({ success: false, message: 'minAmount must be a number' });
    expenses = expenses.filter((e) => e.amount >= min);
  }
  if (maxAmount !== undefined) {
    const max = Number(maxAmount);
    if (Number.isNaN(max)) return res.status(400).json({ success: false, message: 'maxAmount must be a number' });
    expenses = expenses.filter((e) => e.amount <= max);
  }

  // Step 3: text search in the title or description, ignoring capital letters.
  if (search) {
    const term = String(search).toLowerCase();
    expenses = expenses.filter(
      (e) => e.title.toLowerCase().includes(term) || (e.description || '').toLowerCase().includes(term)
    );
  }

  // Step 4: sorting: "date", "amount", "title" - put a minus in front for descending.
  // e.g. sort=-amount means "biggest amount first". Newest date first by default.
  const allowedSorts = ['date', 'amount', 'title', 'createdAt'];
  const descending = sort.startsWith('-');
  const sortField = descending ? sort.slice(1) : sort; // chop off the minus sign
  if (!allowedSorts.includes(sortField)) {
    return res.status(400).json({
      success: false,
      message: `sort must be one of: ${allowedSorts.join(', ')} (prefix with - for descending)`,
    });
  }
  // The compare function returns 1, -1 or 0 (bigger, smaller, equal).
  // For descending order we simply flip the sign.
  expenses.sort((a, b) => {
    const result = a[sortField] > b[sortField] ? 1 : a[sortField] < b[sortField] ? -1 : 0;
    return descending ? -result : result;
  });

  // Step 5: pagination: split long lists into pages.
  // page is at least 1; limit is between 1 and 100 (20 if not given).
  // A nonsense value like limit=abc quietly falls back to the default.
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const totalItems = expenses.length;
  // totalAmount covers ALL matching expenses, not just the current page.
  const totalAmount = round2(expenses.reduce((sum, e) => sum + e.amount, 0));
  // e.g. page 2 with limit 5 -> slice(5, 10) -> items 6 to 10.
  const pageItems = expenses.slice((page - 1) * limit, page * limit);

  res.json({
    success: true,
    count: pageItems.length,  // items on THIS page
    totalItems,               // items across all pages (after filtering)
    totalAmount,
    page,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    data: pageItems,
  });
}


// ---------------------------------------------------------------------------
// READ ONE - GET /api/expenses/:id
// ---------------------------------------------------------------------------

function getExpenseById(req, res) {
  // req.params.id is the ":id" part of the URL. find() gives the first match,
  // or undefined if there isn't one.
  const expense = readAll().find((e) => e.id === req.params.id);
  if (!expense) {
    return res.status(404).json({ success: false, message: `No expense found with id ${req.params.id}` });
  }
  res.json({ success: true, data: expense });
}


// ---------------------------------------------------------------------------
// UPDATE - PUT /api/expenses/:id   (replace all fields)
//          PATCH /api/expenses/:id (change only the fields you send)
// Both share this function; the validator decides which fields are required.
// ---------------------------------------------------------------------------

function updateExpense(req, res) {
  const expenses = readAll();
  const index = expenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: `No expense found with id ${req.params.id}` });
  }

  const isPut = req.method === 'PUT';
  const existing = expenses[index];

  // Build the updated expense. Read it top to bottom - later lines win:
  //  1. start with everything already saved,
  //  2. for PUT only, clear the description (PUT means "replace everything"),
  //  3. apply whatever the client sent,
  //  4. force id and createdAt back to the originals so they can never change,
  //  5. stamp a fresh updatedAt.
  const updated = {
    ...existing,
    ...(isPut ? { description: '' } : {}), // PUT replaces, so an omitted description is cleared
    ...pickFields(req.body),
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  expenses[index] = updated;
  writeAll(expenses);
  res.json({ success: true, message: 'Expense updated', data: updated });
}


// ---------------------------------------------------------------------------
// DELETE - DELETE /api/expenses/:id
// ---------------------------------------------------------------------------

function deleteExpense(req, res) {
  const expenses = readAll();
  const index = expenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: `No expense found with id ${req.params.id}` });
  }

  // splice cuts one item out of the array and gives it back to us, so we can
  // show the client exactly what was removed.
  const [removed] = expenses.splice(index, 1);
  writeAll(expenses);
  res.json({ success: true, message: 'Expense deleted', data: removed });
}


// ---------------------------------------------------------------------------
// SUMMARY - GET /api/expenses/summary
// Totals per category. Optional: startDate, endDate, category
// ---------------------------------------------------------------------------

function getSummary(req, res) {
  const filtered = applyFilters(readAll(), req.query);
  if (filtered.error) return res.status(400).json({ success: false, message: filtered.error });
  const expenses = filtered.expenses;

  // Keep a running total and count for each category, e.g.
  // { Food: { total: 30, count: 2 }, Transport: { total: 10, count: 1 } }
  const byCategory = {};
  for (const e of expenses) {
    if (!byCategory[e.category]) byCategory[e.category] = { total: 0, count: 0 };
    byCategory[e.category].total = round2(byCategory[e.category].total + e.amount);
    byCategory[e.category].count += 1;
  }

  const totalAmount = round2(expenses.reduce((sum, e) => sum + e.amount, 0));

  res.json({
    success: true,
    data: {
      totalAmount,
      totalExpenses: expenses.length,
      // Guard against dividing by zero when there are no expenses.
      averageExpense: expenses.length ? round2(totalAmount / expenses.length) : 0,
      byCategory,
    },
  });
}


// ---------------------------------------------------------------------------
// CATEGORIES - GET /api/categories
// ---------------------------------------------------------------------------

function getCategories(req, res) {
  res.json({ success: true, data: CATEGORIES });
}

// Export every handler so the router (and app.js) can use them.
module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getSummary,
  getCategories,
};
