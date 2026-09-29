// server.js - the entry point. It starts the app listening on a port.
// Run with:  npm start   (or  npm run dev  to auto-restart when you edit code)

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Group 3A Expense Tracker API running at http://localhost:${PORT}`);
});