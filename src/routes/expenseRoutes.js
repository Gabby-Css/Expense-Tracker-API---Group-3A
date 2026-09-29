// expenseRoutes.js - connects URLs + HTTP methods to controller functions.


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
