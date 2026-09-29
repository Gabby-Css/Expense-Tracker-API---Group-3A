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