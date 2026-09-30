// app.js - builds the Express application.
//
// Think of this file as the control room of the API. It doesn't start the
// server (that's server.js) and it doesn't contain any business logic (that's
// the controller). Its job is to switch on the middleware, plug in the routes,
// and put the safety nets at the very end.
//
// Keeping "building the app" separate from "starting the server" lets our tests
// load the app without opening a real port.

const express = require('express');
const cors = require('cors');       // lets websites on other addresses call our API
const morgan = require('morgan');   // prints one log line for every request

const expenseRoutes = require('./routes/expenseRoutes');
const { getCategories } = require('./controllers/expenseController');
const { notFound, errorHandler } = require('./middleware/errorHandlers');

// Create the app. Everything below is attached to this one object.
const app = express();

// ---------------------------------------------------------------------------
// Global middleware: runs on EVERY request, in this order.
// Order matters - each one prepares the request for the next.
// ---------------------------------------------------------------------------

// Allow browsers and front-ends on other addresses to call the API.
// Without this, a web page on localhost:5173 would be blocked from calling us.
app.use(cors());

// Read the JSON body of a request and turn it into a JavaScript object,
// available as req.body. Without this line, req.body would be undefined.
app.use(express.json());

// Log each request in the terminal, e.g. "GET /api/expenses 200 2 ms".
// We switch it off while running tests so the test output stays clean.
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ---------------------------------------------------------------------------
// Routes: connect URLs to the code that answers them.
// ---------------------------------------------------------------------------

// Welcome page. Handy to show first in a demo: it lists every endpoint.
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

// Health check: "are you alive?". Also reports how long the server has been up.
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

// The list of categories an expense is allowed to use.
app.get('/api/categories', getCategories);

// Everything that starts with /api/expenses is handled by the expense router.
// (The router only has to write "/" or "/:id" - this prefix is added for it.)
app.use('/api/expenses', expenseRoutes);

// ---------------------------------------------------------------------------
// Error handling: these MUST come last.
// If no route above answered, notFound replies with a 404.
// If anything threw an error along the way, errorHandler deals with it.
// ---------------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// Export the app (without starting it) so server.js and the tests can use it.
module.exports = app;
