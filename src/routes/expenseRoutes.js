// expenseRoutes.js - connects URLs + HTTP methods to controller functions.
//
// Think of the router as the waiter: it listens for the request ("a POST to
// /"), optionally sends it through a check (validation), then hands it to the
// right function in the controller.
//
// Every path here is relative to /api/expenses, because app.js mounts this
// router there. So router.get('/:id') really means GET /api/expenses/:id.

const express = require('express');
const controller = require('../controllers/expenseController');
const { validateExpense } = require('../middleware/validateExpense');

const router = express.Router();

// NOTE: /summary must come BEFORE /:id, otherwise Express would treat the
// word "summary" as an id. Express tries routes from top to bottom.
router.get('/summary', controller.getSummary);

// Each line reads: method, path, [checks that run first], function to run.
// validateExpense() = all fields required.  validateExpense({ partial: true })
// = fields are optional, but any field that IS sent still gets checked.
router.post('/', validateExpense(), controller.createExpense);             // Create
router.get('/', controller.getExpenses);                                   // Read all
router.get('/:id', controller.getExpenseById);                             // Read one
router.put('/:id', validateExpense(), controller.updateExpense);           // Update (full)
router.patch('/:id', validateExpense({ partial: true }), controller.updateExpense); // Update (partial)
router.delete('/:id', controller.deleteExpense);                           // Delete

module.exports = router;
