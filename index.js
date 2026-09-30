// index.js - our very first "Hello World" server from the project setup step.
//
// NOTE: this file is not used by the real API. `npm start` runs src/server.js.
// It is kept only as a record of the first test that proved Express works.

const express = require('express');
const app = express();

const PORT = 3000;

// The simplest possible route: visiting "/" replies with plain text.
app.get('/', (req, res) => {
  res.send('Hello World! My Group 3A server is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
