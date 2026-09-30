// db.js - our "database". It is really just a JSON file on disk.
//
// This is the ONLY file that touches the disk. Every other file asks for the
// data through readAll() and saves it through writeAll(). That means if we
// ever move to a real database (MongoDB, PostgreSQL...), this is the one file
// we would change.

const fs = require('fs');
const path = require('path');

// Where the data lives. By default it's data/express.json in the project root.
// The DATA_FILE environment variable can point somewhere else - the tests use
// this to work on a temporary file so your real data is never touched.
// (__dirname is this file's folder, src/data, so the two '..' climb to the root.)
const DATA_FILE = (process.env.DATA_FILE)
  ? path.resolve(process.env.DATA_FILE)
  : path.join(__dirname, '..', '..', 'data', 'express.json');

// Make sure the folder and the file exist before we try to read them.
// A brand-new file starts as an empty list: [].
function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}

// Read every expense from the file and return them as an array.
// The calls are "sync" (they wait until done), so one request finishes its
// read and write before the next one starts.
function readAll() {
  ensureFile();
  const text = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    // An empty file counts as an empty list.
    return JSON.parse(text || '[]');
  } catch {
    // If the file is corrupted, start fresh instead of crashing the server.
    return [];
  }
}

// Replace the whole file with the given array of expenses.
// Every change works the same way: read everything, change the array in
// memory, then write everything back. JSON.stringify(..., null, 2) makes the
// file neatly indented so it's easy to read.
function writeAll(expenses) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

module.exports = { readAll, writeAll, DATA_FILE };
