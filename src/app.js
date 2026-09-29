// app.js - builds the Express application

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const expenseRoutes = require('./routes/expenseRoutes');
const { getCategories } = require('./controllers/expenseController');
const { notFound, errorHandler } = require('./middleware/errorHandlers');

const app = express();

// Global middleware (runs on every request, in this order) 
app.use(cors()); // allow browsers/front-ends on other addresses to call the API
app.use(express.json()); // turn a JSON request body into a JavaScript object (req.body)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')); // log each request in the terminal, e.g. "GET /api/expenses 200"
}

// Routes
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

//Error handling 
app.use(notFound);
app.use(errorHandler);

module.exports = app;