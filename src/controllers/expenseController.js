// expenseController.js - the actual logic for each endpoint.
// Every function receives (req, res): the incoming request and the response

const crypto = require('crypto');
const { readAll, writeAll } = require('../data/db');
const CATEGORIES = require('../data/categories');
const {isValidDate} = require('../middleware/validateExpense');

// Round money to 2 decimal places 
const round2 = (n) => Math.round(n * 100) / 100;

// Only copy the fields we allow, so users can't sneak in extra data
// (like overwriting "id" or "createdAt").
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
function applyFilters(expenses, query) {
  const { category, startDate, endDate } = query;

  if (category && !CATEGORIES.includes(category)) {
    return { error: `category must be one of: ${CATEGORIES.join(', ')}` };
  }
  if (startDate && !isValidDate(startDate)) return { error: 'startDate must be YYYY-MM-DD' };
  if (endDate && !isValidDate(endDate)) return { error: 'endDate must be YYYY-MM-DD' };

  // YYYY-MM-DD strings compare correctly as plain text, so no Date objects needed.
  const result = expenses.filter(
    (e) =>
      (!category || e.category === category) &&
      (!startDate || e.date >= startDate) &&
      (!endDate || e.date <= endDate)
  );
  return { expenses: result };
}


// CREATE - POST /api/expenses

function createExpense(req, res) {
  const expenses = readAll();
  const now = new Date().toISOString();

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


// READ ALL - GET /api/expenses
// Optional query params: category, startDate, endDate, minAmount, maxAmount,
// search, sort, page, limit

function getExpenses(req, res) {
  const filtered = applyFilters(readAll(), req.query);
  if (filtered.error) return res.status(400).json({ success: false, message: filtered.error });
  let expenses = filtered.expenses;

  const { minAmount, maxAmount, search, sort = '-date' } = req.query;

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
  if (search) {
    const term = String(search).toLowerCase();
    expenses = expenses.filter(
      (e) => e.title.toLowerCase().includes(term) || (e.description || '').toLowerCase().includes(term)
    );
  }

  // Sorting: "date", "amount", "title" - put a minus in front for descending.
  const allowedSorts = ['date', 'amount', 'title', 'createdAt'];
  const descending = sort.startsWith('-');
  const sortField = descending ? sort.slice(1) : sort;
  if (!allowedSorts.includes(sortField)) {
    return res.status(400).json({
      success: false,
      message: `sort must be one of: ${allowedSorts.join(', ')} (prefix with - for descending)`,
    });
  }
  expenses.sort((a, b) => {
    const result = a[sortField] > b[sortField] ? 1 : a[sortField] < b[sortField] ? -1 : 0;
    return descending ? -result : result;
  });

  // Pagination: split long lists into pages.
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const totalItems = expenses.length;
  const totalAmount = round2(expenses.reduce((sum, e) => sum + e.amount, 0));
  const pageItems = expenses.slice((page - 1) * limit, page * limit);

  res.json({
    success: true,
    count: pageItems.length,
    totalItems,
    totalAmount,
    page,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    data: pageItems,
  });
}

// READ ONE - GET /api/expenses/:id

function getExpenseById(req, res) {
  const expense = readAll().find((e) => e.id === req.params.id);
  if (!expense) {
    return res.status(404).json({ success: false, message: `No expense found with id ${req.params.id}` });
  }
  res.json({ success: true, data: expense });
}


// UPDATE - PUT /api/expenses/:id   (replace all fields)
//          PATCH /api/expenses/:id (change only the fields you send)
// Both share this function; the validator decides which fields are required.

function updateExpense(req, res) {
  const expenses = readAll();
  const index = expenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: `No expense found with id ${req.params.id}` });
  }

  const isPut = req.method === 'PUT';
  const existing = expenses[index];
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


// DELETE - DELETE /api/expenses/:id

function deleteExpense(req, res) {
  const expenses = readAll();
  const index = expenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: `No expense found with id ${req.params.id}` });
  }

  const [removed] = expenses.splice(index, 1);
  writeAll(expenses);
  res.json({ success: true, message: 'Expense deleted', data: removed });
}

// SUMMARY — GET /api/expenses/summary
// Totals per category. Optional: startDate, endDate, category

function getSummary(req, res) {
  const filtered = applyFilters(readAll(), req.query);
  if (filtered.error) return res.status(400).json({ success: false, message: filtered.error });
  const expenses = filtered.expenses;

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
      averageExpense: expenses.length ? round2(totalAmount / expenses.length) : 0,
      byCategory,
    },
  });
}


// CATEGORIES - GET /api/categories

function getCategories(req, res) {
  res.json({ success: true, data: CATEGORIES });
}

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getSummary,
  getCategories,
};

