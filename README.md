# Group 3A — Expense Tracker API

A REST API for tracking personal expenses, built with Node.js and Express. Expenses are stored in a local JSON file, so no database setup is required.

## Features

- Create, read, update, delete (CRUD) expenses
- Filter by category, date range, amount range, and search text
- Sort and paginate results
- Category totals and summary statistics
- Input validation with clear error messages
- Automated tests (`node --test` + Supertest)

## Requirements

- Node.js and npm (check with `node -v` and `npm -v`)

## Getting Started

```bash
npm install       # install dependencies
npm run seed      # (optional) load sample expenses into data/express.json
npm start         # start the server at http://localhost:3000
```

For development with auto-restart on file changes:

```bash
npm run dev
```

Run the test suite:

```bash
npm test
```

## Project Structure

```
src/
  app.js                     # builds the Express app (middleware, routes)
  server.js                  # entry point, starts the server
  routes/expenseRoutes.js    # URL -> controller mapping
  controllers/expenseController.js  # request handling logic
  middleware/validateExpense.js     # validates expense input
  middleware/errorHandlers.js       # 404 + error handling
  data/db.js                 # reads/writes the JSON data file
  data/categories.js         # allowed expense categories
  data/seed.js                # seeds sample data
data/express.json            # expense data store (created automatically)
tests/expenses.test.js       # API tests
```

## API Endpoints

| Method | Endpoint              | Description                                                                                   |
| ------ | --------------------- | ----------------------------------------------------------------------------------------------- |
| GET    | `/api/health`          | Check that the API is running                                                                   |
| GET    | `/api/categories`      | List allowed categories                                                                         |
| POST   | `/api/expenses`        | Create an expense                                                                               |
| GET    | `/api/expenses`        | List expenses (filters: `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `search`, `sort`, `page`, `limit`) |
| GET    | `/api/expenses/summary`| Totals by category                                                                              |
| GET    | `/api/expenses/:id`    | Get one expense                                                                                 |
| PUT    | `/api/expenses/:id`    | Replace an expense                                                                               |
| PATCH  | `/api/expenses/:id`    | Update some fields of an expense                                                                |
| DELETE | `/api/expenses/:id`    | Delete an expense                                                                               |

### Expense object

```json
{
  "id": "3f1c9a2e-...",
  "title": "Lunch at campus canteen",
  "amount": 25.5,
  "category": "Food",
  "date": "2026-09-01",
  "description": "",
  "createdAt": "2026-09-01T12:00:00.000Z",
  "updatedAt": "2026-09-01T12:00:00.000Z"
}
```

Allowed categories: `Food`, `Transport`, `Housing`, `Utilities`, `Health`, `Education`, `Entertainment`, `Shopping`, `Other`.

### Example requests

Create an expense:

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Lunch","amount":25.5,"category":"Food","date":"2026-09-01"}'
```

List expenses in a category, sorted by amount descending:

```bash
curl "http://localhost:3000/api/expenses?category=Food&sort=-amount"
```

Get category totals:

```bash
curl http://localhost:3000/api/expenses/summary
```

## Configuration

| Variable    | Default                    | Purpose                          |
| ----------- | --------------------------- | --------------------------------- |
| `PORT`      | `3000`                      | Port the server listens on        |
| `DATA_FILE` | `data/express.json`         | Path to the JSON data store       |
