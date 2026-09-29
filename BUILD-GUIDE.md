# Expense Tracker API — Full Build Guide (Steps 1–17)

This is your offline, step-by-step manual for building the Expense Tracker API
from scratch in this `Group 3A` folder. Follow it in order, typing each
file yourself. Every step tells you **what to do**, **what to type**, and
**what you should see** if it worked.

Your project currently sits at the end of **Step 7** — an organized folder
structure with one working "Hello World" server. Start from **Step 8** below.
(Steps 1–7 are included at the top so this guide is complete on its own if
you ever want to redo the whole thing from zero.)

---

## Step 1 — Check Node.js is installed

Open a terminal in the `Group 3A` folder and run:

```
node -v
npm -v
```

**Expect:** each prints a version number (e.g. `v20.11.0`, `10.2.4`). If you
get "not recognized," install Node.js from https://nodejs.org first (choose
the LTS version), then try again.

---

## Step 2 — Create the project folder

```
cd C:\Users\softenic\Desktop
mkdir "Group 3A"
cd "Group 3A"
pwd
```

**Expect:** `pwd` prints `...\Desktop\Group 3A`.

---

## Step 3 — Initialize the project

```
npm init -y
```

This creates `package.json` — the project's ID card (name, version, scripts,
dependencies).

**Expect:** a `package.json` file appears with default content.

---

## Step 4 — Install Express

```
npm install express
```

**Expect:** a `node_modules/` folder and `package-lock.json` appear, and
`package.json` gains:
```json
"dependencies": { "express": "^5.2.1" }
```
(version number may vary slightly)

---

## Step 5 — Write your first server

Create `index.js` in the project root with:

```js
const express = require('express');
const app = express();

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello World! My Group 3A server is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
```

---

## Step 6 — Run it

```
node index.js
```

Visit `http://localhost:3000` in your browser — you should see the Hello
World text. Stop the server with `Ctrl+C`.

---

## Step 7 — Organize into folders

```
mkdir src
mkdir src\routes
mkdir src\controllers
mkdir src\data
mkdir src\middleware
mkdir src\config
Move-Item index.js src\server.js
```

- `src/routes/` — which URLs exist and which controller handles them
- `src/controllers/` — the actual logic for each route
- `src/data/` — where expense data is stored/loaded
- `src/middleware/` — functions that run before a route's main logic
- `src/config/` — shared constants (not heavily used in this project, kept
  for structure)

Test it still runs: `node src\server.js`, check the browser, `Ctrl+C` to stop.

**👉 This is where your project currently stands. Continue below.**

---

## Step 8 — Build the data layer

This is the "database" — a JSON file on disk, plus the list of allowed
categories, plus a script to fill in sample data.

### `src/data/categories.js`

```js
// The list of categories an expense is allowed to have.
// Keeping them in one place means validation and the /categories endpoint
// always agree with each other.

const CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Health',
  'Education',
  'Entertainment',
  'Shopping',
  'Other',
];

module.exports = CATEGORIES;
```

### `src/data/db.js`

```js
// db.js — a tiny "database" that stores expenses in a JSON file.
// Using a file keeps the project simple: no database server to install,
// and your data survives when the server restarts.

const fs = require('fs');
const path = require('path');

// The file location can be changed with the DATA_FILE environment variable
// (the tests use this so they never touch your real data).
const DATA_FILE = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.join(__dirname, '..', '..', 'data', 'expenses.json');

// Make sure the file exists before we try to read it.
function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}

// Read every expense from the file and return them as an array.
function readAll() {
  ensureFile();
  const text = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(text || '[]');
  } catch {
    // If the file is corrupted, start fresh instead of crashing the server.
    return [];
  }
}

// Replace the whole file with the given array of expenses.
function writeAll(expenses) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

module.exports = { readAll, writeAll, DATA_FILE };
```

### `src/data/seed.js`

```js
// seed.js — fills the database with sample expenses for demos.
// Run it with:  npm run seed

const crypto = require('crypto');
const { writeAll, DATA_FILE } = require('./db');

const now = new Date().toISOString();

const samples = [
  { title: 'Lunch at campus canteen', amount: 25.5, category: 'Food', date: '2026-09-01' },
  { title: 'Trotro to Adum', amount: 8, category: 'Transport', date: '2026-09-02' },
  { title: 'Hostel rent (September)', amount: 1200, category: 'Housing', date: '2026-09-03' },
  { title: 'ECG prepaid electricity', amount: 150, category: 'Utilities', date: '2026-09-05' },
  { title: 'Data bundle', amount: 50, category: 'Utilities', date: '2026-09-06' },
  { title: 'Programming textbook', amount: 180, category: 'Education', date: '2026-09-08' },
  { title: 'Movie night', amount: 60, category: 'Entertainment', date: '2026-09-12' },
  { title: 'Pharmacy — malaria drugs', amount: 45, category: 'Health', date: '2026-09-14' },
].map((e) => ({
  id: crypto.randomUUID(),
  ...e,
  description: '',
  createdAt: now,
  updatedAt: now,
}));

writeAll(samples);
console.log(`Seeded ${samples.length} sample expenses into ${DATA_FILE}`);
```

**Why this matters:** `db.js` never talks about expenses directly — it just
reads/writes a JSON array. That separation means the controllers (Step 10)
don't need to know *how* data is stored, only that `readAll()`/`writeAll()`
exist.

---

## Step 9 — Add middleware (validation + error handling)

Middleware = functions that run **before** or **around** your main route
logic — for checks, logging, or cleanup.

### `src/middleware/validateExpense.js`

```js
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

module.exports = { validateExpense, isValidDate };
```

### `src/middleware/errorHandlers.js`

```js
// errorHandlers.js — the "safety nets" at the end of the app.

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
```

**Why this matters:** validation runs *before* a controller ever touches the
data, so bad input never gets saved. Error handlers sit at the very end of
the app and catch anything unexpected, so the server never just crashes
silently.

---

## Step 10 — Build the controller (the real logic)

### `src/controllers/expenseController.js`

```js
// expenseController.js — the actual logic for each endpoint.
// Every function receives (req, res): the incoming request and the response
// we send back.

const crypto = require('crypto');
const { readAll, writeAll } = require('../data/db');
const CATEGORIES = require('../data/categories');
const { isValidDate } = require('../middleware/validateExpense');

// Round money to 2 decimal places (avoids results like 0.30000000000000004).
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

// ---------------------------------------------------------------------------
// CREATE — POST /api/expenses
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// READ ALL — GET /api/expenses
// Optional query params: category, startDate, endDate, minAmount, maxAmount,
// search, sort, page, limit
// ---------------------------------------------------------------------------
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

  // Sorting: "date", "amount", "title" — put a minus in front for descending.
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

// ---------------------------------------------------------------------------
// READ ONE — GET /api/expenses/:id
// ---------------------------------------------------------------------------
function getExpenseById(req, res) {
  const expense = readAll().find((e) => e.id === req.params.id);
  if (!expense) {
    return res.status(404).json({ success: false, message: `No expense found with id ${req.params.id}` });
  }
  res.json({ success: true, data: expense });
}

// ---------------------------------------------------------------------------
// UPDATE — PUT /api/expenses/:id   (replace all fields)
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
// DELETE — DELETE /api/expenses/:id
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// SUMMARY — GET /api/expenses/summary
// Totals per category. Optional: startDate, endDate, category
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// CATEGORIES — GET /api/categories
// ---------------------------------------------------------------------------
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
```

**Why this matters:** this is the "business logic" layer. Notice every
function has the same shape: read data, do something with it, send a JSON
response. `pickFields` is a security habit — it stops someone from sending
`{ "id": "hacked" }` in the request body and overwriting the real ID.

---

## Step 11 — Wire up the routes

### `src/routes/expenseRoutes.js`

```js
// expenseRoutes.js — connects URLs + HTTP methods to controller functions.
// Think of it as the "menu" of the API.

const express = require('express');
const controller = require('../controllers/expenseController');
const { validateExpense } = require('../middleware/validateExpense');

const router = express.Router();

// NOTE: /summary must come BEFORE /:id, otherwise Express would treat the
// word "summary" as an id.
router.get('/summary', controller.getSummary);

router.post('/', validateExpense(), controller.createExpense);             // Create
router.get('/', controller.getExpenses);                                   // Read all
router.get('/:id', controller.getExpenseById);                             // Read one
router.put('/:id', validateExpense(), controller.updateExpense);           // Update (full)
router.patch('/:id', validateExpense({ partial: true }), controller.updateExpense); // Update (partial)
router.delete('/:id', controller.deleteExpense);                           // Delete

module.exports = router;
```

**Why `/summary` must be first:** Express matches routes top to bottom. If
`/:id` came first, a request to `/api/expenses/summary` would match `:id`
with `id = "summary"` instead of reaching the real summary route.

---

## Step 12 — Assemble the app

First install two more packages this step needs:

```
npm install cors morgan
```

- **cors** — lets a browser page on a different address (like a front-end
  app) call this API.
- **morgan** — prints a line in your terminal for every request, e.g.
  `GET /api/expenses 200 4.3 ms`.

### `src/app.js`

```js
// app.js - builds the Express application


const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const expenseRoutes = require('./routes/expenseRoutes');
const { getCategories } = require('./controllers/expenseController');
const { notFound, errorHandler } = require('./middleware/errorHandlers');

const app = express();

// ---- Global middleware (runs on every request, in this order) ----
app.use(cors()); // allow browsers/front-ends on other addresses to call the API
app.use(express.json()); // turn a JSON request body into a JavaScript object (req.body)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')); // log each request in the terminal, e.g. "GET /api/expenses 200"
}

// ---- Routes ----
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Group 3A Expense Tracker API',
    endpoints: {
      'GET    /api/health': 'Check that the API is running',
      'GET    /api/categories': 'List allowed categories',
      'POST   /api/expenses': 'Create an expense',
      'GET    /api/expenses': 'List expenses (filters: category, startDate, endDate, minAmount, maxAmount, search, sort, page, limit)',
      'GET    /api/expenses/summary': 'Totals by category',
      'GET    /api/expenses/:id': 'Get one expense',
      'PUT    /api/expenses/:id': 'Replace an expense',
      'PATCH  /api/expenses/:id': 'Update some fields of an expense',
      'DELETE /api/expenses/:id': 'Delete an expense',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

app.get('/api/categories', getCategories);
app.use('/api/expenses', expenseRoutes);

// ---- Error handling (must be LAST) ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

**Order matters here:**
1. `cors()` and `express.json()` first, so every route can rely on `req.body`
   being parsed and cross-origin requests being allowed.
2. `morgan` logging next.
3. Your actual routes.
4. `notFound` and `errorHandler` **last** — they only catch what nothing
   above them handled.

Notice `app.js` does **not** call `app.listen()`. That's on purpose — see
Step 13.

---

## Step 13 — Rewrite the entry point (`server.js`)

Replace the contents of `src/server.js` (your Step 5/7 hello-world version)
with:

```js
// server.js — the entry point. It starts the app listening on a port.
// Run with:  npm start   (or  npm run dev  to auto-restart when you edit code)

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Group 3A Expense Tracker API running at http://localhost:${PORT}`);
});
```

**Why split `app.js` and `server.js`?** `app.js` describes *what* the API
does; `server.js` just turns it on. This split lets automated tests (Step
15) import `app.js` directly and simulate requests, without needing a real
network port.

---

## Step 14 — Update `package.json`

Open `package.json` and make sure the `"scripts"` section looks like this:

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "node --test tests/*.test.js",
  "seed": "node src/data/seed.js"
},
```

Also update `"main"` to `"src/server.js"` and give `"description"` a real
value if you like. Then install the two dev-only tools this needs:

```
npm install --save-dev nodemon supertest
```

- **nodemon** — restarts the server automatically whenever you save a file
  (use with `npm run dev`).
- **supertest** — lets automated tests send fake HTTP requests to your app
  without starting a real server.

`--save-dev` puts them under `"devDependencies"` because they're only needed
while developing/testing, not when the app actually runs in production.

---

## Step 15 — Write automated tests

```
mkdir tests
```

### `tests/expenses.test.js`

```js
// Automated tests. Run with:  npm test
// They use a temporary data file, so your real expenses are never touched.

const os = require('os');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';
process.env.DATA_FILE = path.join(os.tmpdir(), `expenses-test-${process.pid}.json`);

const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

const sample = { title: 'Lunch', amount: 25.5, category: 'Food', date: '2026-09-01' };

beforeEach(() => fs.writeFileSync(process.env.DATA_FILE, '[]'));
after(() => fs.rmSync(process.env.DATA_FILE, { force: true }));

test('GET /api/health returns ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('POST creates an expense', async () => {
  const res = await request(app).post('/api/expenses').send(sample);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.title, 'Lunch');
  assert.equal(res.body.data.amount, 25.5);
  assert.ok(res.body.data.id);
  assert.ok(res.body.data.createdAt);
});

test('POST rejects invalid data with 400 and lists every error', async () => {
  const res = await request(app)
    .post('/api/expenses')
    .send({ title: '', amount: -5, category: 'Cars', date: '2026-02-30' });
  assert.equal(res.status, 400);
  assert.equal(res.body.errors.length, 4);
});

test('POST rejects malformed JSON', async () => {
  const res = await request(app)
    .post('/api/expenses')
    .set('Content-Type', 'application/json')
    .send('{"title": "oops",');
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Invalid JSON in request body');
});

test('POST ignores fields the client is not allowed to set', async () => {
  const res = await request(app).post('/api/expenses').send({ ...sample, id: 'hacked' });
  assert.notEqual(res.body.data.id, 'hacked');
});

test('GET lists expenses with totals, newest first', async () => {
  await request(app).post('/api/expenses').send(sample);
  await request(app).post('/api/expenses').send({ ...sample, amount: 10, date: '2026-09-05' });
  const res = await request(app).get('/api/expenses');
  assert.equal(res.status, 200);
  assert.equal(res.body.totalItems, 2);
  assert.equal(res.body.totalAmount, 35.5);
  assert.equal(res.body.data[0].date, '2026-09-05');
});

test('GET filters by category, date range and amount', async () => {
  await request(app).post('/api/expenses').send(sample);
  await request(app).post('/api/expenses').send({ ...sample, category: 'Transport', amount: 8, date: '2026-09-10' });
  await request(app).post('/api/expenses').send({ ...sample, amount: 100, date: '2026-10-01' });

  let res = await request(app).get('/api/expenses?category=Transport');
  assert.equal(res.body.totalItems, 1);

  res = await request(app).get('/api/expenses?startDate=2026-09-01&endDate=2026-09-30');
  assert.equal(res.body.totalItems, 2);

  res = await request(app).get('/api/expenses?minAmount=50');
  assert.equal(res.body.totalItems, 1);
});

test('GET rejects an invalid filter value', async () => {
  const res = await request(app).get('/api/expenses?category=Cars');
  assert.equal(res.status, 400);
});

test('GET /:id returns one expense, or 404 if missing', async () => {
  const created = await request(app).post('/api/expenses').send(sample);
  const ok = await request(app).get(`/api/expenses/${created.body.data.id}`);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.id, created.body.data.id);

  const missing = await request(app).get('/api/expenses/does-not-exist');
  assert.equal(missing.status, 404);
});

test('PUT replaces an expense', async () => {
  const created = await request(app).post('/api/expenses').send({ ...sample, description: 'old' });
  const res = await request(app)
    .put(`/api/expenses/${created.body.data.id}`)
    .send({ title: 'Dinner', amount: 40, category: 'Food', date: '2026-09-02' });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.title, 'Dinner');
  assert.equal(res.body.data.description, '');
  assert.equal(res.body.data.createdAt, created.body.data.createdAt);
});

test('PUT requires all fields', async () => {
  const created = await request(app).post('/api/expenses').send(sample);
  const res = await request(app).put(`/api/expenses/${created.body.data.id}`).send({ amount: 40 });
  assert.equal(res.status, 400);
});

test('PATCH updates only the fields sent', async () => {
  const created = await request(app).post('/api/expenses').send(sample);
  const res = await request(app).patch(`/api/expenses/${created.body.data.id}`).send({ amount: 30 });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.amount, 30);
  assert.equal(res.body.data.title, 'Lunch');
});

test('DELETE removes an expense', async () => {
  const created = await request(app).post('/api/expenses').send(sample);
  const del = await request(app).delete(`/api/expenses/${created.body.data.id}`);
  assert.equal(del.status, 200);
  const again = await request(app).get(`/api/expenses/${created.body.data.id}`);
  assert.equal(again.status, 404);
});

test('GET /summary totals by category', async () => {
  await request(app).post('/api/expenses').send(sample);
  await request(app).post('/api/expenses').send({ ...sample, amount: 4.5 });
  await request(app).post('/api/expenses').send({ ...sample, category: 'Transport', amount: 10 });
  const res = await request(app).get('/api/expenses/summary');
  assert.equal(res.body.data.totalAmount, 40);
  assert.equal(res.body.data.byCategory.Food.total, 30);
  assert.equal(res.body.data.byCategory.Food.count, 2);
});

test('Unknown routes return 404', async () => {
  const res = await request(app).get('/api/banana');
  assert.equal(res.status, 404);
});
```

Run the tests:

```
npm test
```

**Expect:** `tests 15`, `pass 15`, `fail 0`.

---

## Step 16 — Add `.gitignore`

### `.gitignore`

```
node_modules/
.env
*.log
.DS_Store
Thumbs.db
```

This tells Git (version control) to never track `node_modules` (it's huge
and machine-specific — anyone can regenerate it with `npm install`).

---

## Step 17 — Try it all out

```
npm run seed      # loads 8 sample expenses into data/expenses.json
npm start         # starts the real server
```

Visit or test with curl/Postman:

| URL | What it should show |
|---|---|
| `http://localhost:3000/` | Welcome message + list of endpoints |
| `http://localhost:3000/api/health` | `{ "success": true, "status": "ok", ... }` |
| `http://localhost:3000/api/categories` | The 9 category names |
| `http://localhost:3000/api/expenses` | The 8 seeded expenses |
| `http://localhost:3000/api/expenses/summary` | Totals per category |

Stop the server with `Ctrl+C` when done.

Use `npm run dev` instead of `npm start` while actively coding — it
auto-restarts the server every time you save a file.

---

## Final project structure

```
Group 3A/
├── src/
│   ├── server.js                  # Starts the server
│   ├── app.js                     # Builds the Express app (middleware + routes)
│   ├── routes/expenseRoutes.js    # URL → controller mapping
│   ├── controllers/expenseController.js  # Logic for each endpoint
│   ├── middleware/
│   │   ├── validateExpense.js     # Input validation
│   │   └── errorHandlers.js       # 404 and error handling
│   └── data/
│       ├── db.js                  # Reads/writes the JSON file
│       ├── categories.js          # Allowed categories
│       └── seed.js                # Sample data
├── data/expenses.json             # The stored expenses (created automatically)
├── tests/expenses.test.js         # Automated tests
├── .gitignore
├── package.json
└── package-lock.json
```

---

## Quick command reference

| Command | What it does |
|---|---|
| `npm install` | Installs all dependencies listed in `package.json` |
| `npm start` | Runs the server once |
| `npm run dev` | Runs the server, auto-restarting on file changes |
| `npm test` | Runs the automated test suite |
| `npm run seed` | Fills `data/expenses.json` with sample data |

Good luck — take it one file at a time, and re-read the comments in each
code block; they explain *why*, not just *what*.
