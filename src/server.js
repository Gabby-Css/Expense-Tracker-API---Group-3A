// server.js - the entry point. It starts the app listening on a port.
// Run with:  npm start   (or  npm run dev  to auto-restart when you edit code)

// Load the finished app from app.js. All the real setup lives there.
const app = require('./app');

// Use the PORT environment variable if someone set one, otherwise 3000.
// (In PowerShell:  $env:PORT=3001; npm start)
const PORT = process.env.PORT || 3000;

// Open the port and wait for requests. The message prints once we're ready.
app.listen(PORT, () => {
  console.log(`Group 3A Expense Tracker API running at http://localhost:${PORT}`);
});
