// Automated tests. Run with:  npm test
// They use a temporary data file, so your real expenses are never touched.
//
// How it works: "supertest" sends fake HTTP requests straight into our app
// (no real port needed) and we use "assert" to check each response.

const os = require('os');
const path = require('path');
const fs = require('fs');

// IMPORTANT: these two lines must run BEFORE the app is loaded below.
// 'test' switches the request logger off; DATA_FILE points the database at a
// throwaway file in the computer's temp folder instead of data/express.json.
process.env.NODE_ENV = 'test';
process.env.DATA_FILE = path.join(os.tmpdir(), `expenses-test-${process.pid}.json`);

const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

// A valid expense we reuse in many tests. `...sample` copies it and lets a
// test override just the fields it cares about.
const sample = { title: 'Lunch', amount: 25.5, category: 'Food', date: '2026-09-01' };

// Before EVERY test, empty the data file so tests can't affect each other.
beforeEach(() => fs.writeFileSync(process.env.DATA_FILE, '[]'));
// After all tests, delete the temporary file.
after(() => fs.rmSync(process.env.DATA_FILE, { force: true }));


// ---------------------------------------------------------------------------
// Health check and CREATE (POST)
// ---------------------------------------------------------------------------

// The simplest test: is the server alive?
test('GET /api/health returns ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

// A good POST should answer 201 and return the new expense with an id.
test('POST creates an expense', async () => {
  const res = await request(app).post('/api/expenses').send(sample);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.title, 'Lunch');
  assert.equal(res.body.data.amount, 25.5);
  assert.ok(res.body.data.id);
  assert.ok(res.body.data.createdAt);
});

// Four bad fields in, so we expect a 400 with four error messages back
// (proving the API reports every problem at once, not just the first).
test('POST rejects invalid data with 400 and lists every error', async () => {
  const res = await request(app)
    .post('/api/expenses')
    .send({ title: '', amount: -5, category: 'Cars', date: '2026-02-30' });
  assert.equal(res.status, 400);
  assert.equal(res.body.errors.length, 4);
});

// Broken JSON (note the trailing comma and missing brace) must give a clean 400.
test('POST rejects malformed JSON', async () => {
  const res = await request(app)
    .post('/api/expenses')
    .set('Content-Type', 'application/json')
    .send('{"title": "oops",');
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Invalid JSON in request body');
});

// A client must not be able to choose its own id.
test('POST ignores fields the client is not allowed to set', async () => {
  const res = await request(app).post('/api/expenses').send({ ...sample, id: 'hacked' });
  assert.notEqual(res.body.data.id, 'hacked');
});


// ---------------------------------------------------------------------------
// READ (GET): list, filters and one-by-id
// ---------------------------------------------------------------------------

// Two expenses in, so we expect both back, the total added up (25.5 + 10),
// and the newest date first (the default sort).
test('GET lists expenses with totals, newest first', async () => {
  await request(app).post('/api/expenses').send(sample);
  await request(app).post('/api/expenses').send({ ...sample, amount: 10, date: '2026-09-05' });
  const res = await request(app).get('/api/expenses');
  assert.equal(res.status, 200);
  assert.equal(res.body.totalItems, 2);
  assert.equal(res.body.totalAmount, 35.5);
  assert.equal(res.body.data[0].date, '2026-09-05');
});

// Create three different expenses, then check each filter finds the right ones.
test('GET filters by category, date range and amount', async () => {
  await request(app).post('/api/expenses').send(sample);
  await request(app).post('/api/expenses').send({ ...sample, category: 'Transport', amount: 8, date: '2026-09-10' });
  await request(app).post('/api/expenses').send({ ...sample, amount: 100, date: '2026-10-01' });

  // Only one expense is in the Transport category.
  let res = await request(app).get('/api/expenses?category=Transport');
  assert.equal(res.body.totalItems, 1);

  // Two fall inside September; the October one is left out.
  res = await request(app).get('/api/expenses?startDate=2026-09-01&endDate=2026-09-30');
  assert.equal(res.body.totalItems, 2);

  // Only the 100 expense is at least 50.
  res = await request(app).get('/api/expenses?minAmount=50');
  assert.equal(res.body.totalItems, 1);
});

// "Cars" is not a real category, so the API should refuse the filter.
test('GET rejects an invalid filter value', async () => {
  const res = await request(app).get('/api/expenses?category=Cars');
  assert.equal(res.status, 400);
});

// Fetch one expense by its id: a real id works, a made-up id gives 404.
test('GET /:id returns one expense, or 404 if missing', async () => {
  const created = await request(app).post('/api/expenses').send(sample);
  const ok = await request(app).get(`/api/expenses/${created.body.data.id}`);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.id, created.body.data.id);

  const missing = await request(app).get('/api/expenses/does-not-exist');
  assert.equal(missing.status, 404);
});


// ---------------------------------------------------------------------------
// UPDATE (PUT and PATCH), DELETE, summary and unknown routes
// ---------------------------------------------------------------------------

// PUT replaces the whole expense: new title, description cleared,
// but the original createdAt must survive.
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

// PUT is all-or-nothing: sending only the amount is not enough.
test('PUT requires all fields', async () => {
  const created = await request(app).post('/api/expenses').send(sample);
  const res = await request(app).put(`/api/expenses/${created.body.data.id}`).send({ amount: 40 });
  assert.equal(res.status, 400);
});

// PATCH changes only what we send: the amount changes, the title stays.
test('PATCH updates only the fields sent', async () => {
  const created = await request(app).post('/api/expenses').send(sample);
  const res = await request(app).patch(`/api/expenses/${created.body.data.id}`).send({ amount: 30 });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.amount, 30);
  assert.equal(res.body.data.title, 'Lunch');
});

// Delete it, then prove it is really gone by asking for it again (404).
test('DELETE removes an expense', async () => {
  const created = await request(app).post('/api/expenses').send(sample);
  const del = await request(app).delete(`/api/expenses/${created.body.data.id}`);
  assert.equal(del.status, 200);
  const again = await request(app).get(`/api/expenses/${created.body.data.id}`);
  assert.equal(again.status, 404);
});

// Two Food expenses (25.5 + 4.5 = 30) and one Transport (10) -> overall 40.
test('GET /summary totals by category', async () => {
  await request(app).post('/api/expenses').send(sample);
  await request(app).post('/api/expenses').send({ ...sample, amount: 4.5 });
  await request(app).post('/api/expenses').send({ ...sample, category: 'Transport', amount: 10 });
  const res = await request(app).get('/api/expenses/summary');
  assert.equal(res.body.data.totalAmount, 40);
  assert.equal(res.body.data.byCategory.Food.total, 30);
  assert.equal(res.body.data.byCategory.Food.count, 2);
});

// A URL that doesn't exist should get our clean 404, not a crash.
test('Unknown routes return 404', async () => {
  const res = await request(app).get('/api/banana');
  assert.equal(res.status, 404);
});
