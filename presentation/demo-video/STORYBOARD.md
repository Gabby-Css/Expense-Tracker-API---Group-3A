---
format: 1920x1080
duration: 3:37
message: "Group 3A's Expense Tracker API does full CRUD, filtering, summaries and validation, and the tests prove it works."
arc: Hook > What it is > How it works > Run > Create > Read > Update > Delete > Summary > Bad input > Tests > Team > Wrap-up
audience: the lecturer, judges and classmates
mode: autonomous
---

## Frame 1 - Hook

- scene: Hook
- duration: 11.3s
- transition_in: crossfade
- status: animated
- voiceover: "Where did your money go this month? Most students can't say. So our group built an API that keeps the books for you. This is the Group 3A Expense Tracker."
- src: compositions/s01-hook.html

## Frame 2 - What it is

- scene: What it is
- duration: 22.0s
- transition_in: crossfade
- status: animated
- voiceover: "It's a REST API, built with Node.js and Express. Every expense has a title, an amount, a category and a date. It's saved in a simple JSON file, so there's no database to install. You can create, read, update and delete expenses, then filter, search and total them up."
- src: compositions/s02-what.html

## Frame 3 - How it works

- scene: How it works
- duration: 15.1s
- transition_in: crossfade
- status: animated
- voiceover: "Here's how a request travels through our code. It hits a route, passes validation, and the controller does the work. The data layer reads or writes the file, and every answer comes back as clean JSON."
- src: compositions/s03-flow.html

## Frame 4 - Run it

- scene: Run it
- duration: 13.2s
- transition_in: crossfade
- status: animated
- voiceover: "Let's run it. After npm install, we load eight sample expenses with npm run seed. Then npm start, and the server is listening on port 3000."
- src: compositions/s04-run.html

## Frame 5 - Create

- scene: Create
- duration: 21.0s
- transition_in: crossfade
- status: animated
- voiceover: "First, a health check. The server says: status ok. Now Create. We POST a new expense: group project printing, 35, in the Education category. The server answers 201 Created, and gives the expense its own unique ID. And there it is: a new row in the ledger."
- src: compositions/s05-create.html

## Frame 6 - Read

- scene: Read
- duration: 28.3s
- transition_in: crossfade
- status: animated
- voiceover: "Now Read. GET expenses returns the list, newest first, with the total amount and paging built in. Ask for one expense by its ID, and you get exactly that one. You can also filter. Here, only Education expenses, sorted by amount, biggest first. You can also search by text, and add date ranges or amount ranges. And a categories endpoint tells clients which values are allowed."
- src: compositions/s06-read.html

## Frame 7 - Update

- scene: Update
- duration: 18.9s
- transition_in: crossfade
- status: animated
- voiceover: "Update comes in two flavours. PATCH changes only the fields you send. Here we correct the amount to 42.5. PUT replaces the whole expense. We rename it, and set the amount to 60. Either way, updatedAt changes, and createdAt stays put."
- src: compositions/s07-update.html

## Frame 8 - Delete

- scene: Delete
- duration: 11.1s
- transition_in: crossfade
- status: animated
- voiceover: "DELETE removes the expense, and the row leaves the ledger. Ask for it again, and the API answers 404: not found, with a clear message."
- src: compositions/s08-delete.html

## Frame 9 - Summary

- scene: Summary
- duration: 13.2s
- transition_in: crossfade
- status: animated
- voiceover: "The summary endpoint does the bookkeeping. It returns the total spent, the number of expenses, the average, and a breakdown by category. Unsurprisingly, Housing is the big one."
- src: compositions/s09-summary.html

## Frame 10 - Bad input

- scene: Bad input
- duration: 21.6s
- transition_in: crossfade
- status: animated
- voiceover: "What about bad input? We send an empty title, a negative amount, an unknown category, and a date that doesn't exist. The API doesn't crash, and it doesn't guess. It answers 400, and lists every problem at once. Broken JSON, or a route that doesn't exist, gets a clear error too."
- src: compositions/s10-invalid.html

## Frame 11 - Tests

- scene: Tests
- duration: 12.7s
- transition_in: crossfade
- status: animated
- voiceover: "We don't trust it by eye. Fifteen automated tests cover every endpoint, including the failures. They run in about two seconds with npm test. All fifteen pass."
- src: compositions/s11-tests.html

## Frame 12 - The team

- scene: The team
- duration: 19.0s
- transition_in: crossfade
- status: animated
- voiceover: "And we built it as a team of thirteen. Each member owned one part: setup, the data layer, validation, the controller, routes, tests, and documentation. Everyone pushed their work to GitHub as their own commits, merged in order, so each part built on the last."
- src: compositions/s12-team.html

## Frame 13 - Wrap-up

- scene: Wrap-up
- duration: 14.9s
- transition_in: crossfade
- status: animated
- voiceover: "That's the Expense Tracker API: full CRUD, filters, a summary, validation, and fifteen passing tests. The code is on GitHub. Thank you for watching, and we'd love your questions."
- src: compositions/s13-close.html
