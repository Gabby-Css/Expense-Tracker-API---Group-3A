// categories.js - the list of categories an expense is allowed to use.
//
// It lives in ONE place on purpose: the validator, the list filter and the
// /api/categories endpoint all read from it. Add a category here and the whole
// API picks it up. Names are case-sensitive ("Food" works, "food" does not).

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
