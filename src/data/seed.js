// seed.js - fills the database with sample expenses for demos.
// Run it with:  npm run seed
//
// Careful: this REPLACES everything in the data file with the 8 samples below.
// Run it before a demo, never in the middle of one.

const crypto = require('crypto');
const { writeAll, DATA_FILE } = require('./db');

// One timestamp shared by all the samples (it must be called with () to work).
const now = new Date().toISOString();

// Only the fields a person would type. The rest is added in the map() below.
const samples = [
  { title: 'Lunch at campus canteen', amount: 25.5, category: 'Food', date: '2026-09-01' },
  { title: 'Trotro to Adum', amount: 8, category: 'Transport', date: '2026-09-02' },
  { title: 'Hostel rent (September)', amount: 1200, category: 'Housing', date: '2026-09-03' },
  { title: 'ECG prepaid electricity', amount: 150, category: 'Utilities', date: '2026-09-05' },
  { title: 'Data bundle', amount: 50, category: 'Utilities', date: '2026-09-06' },
  { title: 'Programming textbook', amount: 180, category: 'Education', date: '2026-09-08' },
  { title: 'Movie night', amount: 60, category: 'Entertainment', date: '2026-09-12' },
  { title: 'Pharmacy - malaria drugs', amount: 45, category: 'Health', date: '2026-09-14' },
].map((e) => ({
  // Give each sample the same shape the API gives a real expense:
  // a unique id, an empty description and created/updated timestamps.
  id: crypto.randomUUID(),
  ...e,
  description: '',
  createdAt: now,
  updatedAt: now,
}));

// Save them, then tell the user where they went.
writeAll(samples);
console.log(`Seeded ${samples.length} sample expenses into ${DATA_FILE}`);
