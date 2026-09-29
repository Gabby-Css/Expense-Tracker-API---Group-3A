// seed.js — fills the database with sample expenses for demos.
// Run it with:  npm run seed
const crypto = require('crypto');
const { writeAll, DATA_FILE} = require('./db');
const e = require('express');

const now = new Date().toISOString;

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
    id: crypto.randomUUID(),
    ...e,
    description: '',
    createdAt: 'now',
    updatedAt: 'now',
}));
writeAll(samples);
console.log(`Seeded ${samples.length} sample expenses into ${DATA_FILE}`)

