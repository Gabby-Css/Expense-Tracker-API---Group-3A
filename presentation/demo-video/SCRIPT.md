# SCRIPT - expense-tracker-demo

**Voice:** Kokoro af_heart (local, offline), speed 0.9
**Voice direction:** Clear, calm, plain-spoken; a student explaining their own project.

Generated from script.json. Edit the "say" text there (spoken form: "A P I", "J S O N", "N P M") and the
"show" text (the on-screen caption), then run `node scripts/make-voice.mjs` and `node scripts/build.mjs`.

## 01 - Hook

**01a** (1.7s)

    Where did your money go this month?

**01b** (4.8s)

    Most students can't say. So our group built an A P I that keeps the books for you.

**01c** (2.4s)

    This is the Group three A Expense Tracker.

## 02 - What it is

**02a** (4.0s)

    It's a REST A P I, built with Node dot J S and Express.

**02b** (9.8s)

    Every expense has a title, an amount, a category and a date. It's saved in a simple J S O N file, so there's no database to install.

**02c** (5.8s)

    You can create, read, update and delete expenses, then filter, search and total them up.

## 03 - How it works

**03a** (2.5s)

    Here's how a request travels through our code.

**03b** (4.2s)

    It hits a route, passes validation, and the controller does the work.

**03c** (6.0s)

    The data layer reads or writes the file, and every answer comes back as clean J S O N.

## 04 - Run it

**04a** (6.6s)

    Let's run it. After N P M install, we load eight sample expenses with N P M run seed.

**04b** (4.7s)

    Then N P M start, and the server is listening on port three thousand.

## 05 - Create

**05a** (3.5s)

    First, a health check. The server says: status okay.

**05b** (6.7s)

    Now Create. We post a new expense: group project printing, thirty five, in the Education category.

**05c** (5.5s)

    The server answers two oh one, Created, and gives the expense its own unique I D.

**05d** (2.6s)

    And there it is: a new row in the ledger.

## 06 - Read

**06a** (6.5s)

    Now Read. Get expenses returns the list, newest first, with the total amount and paging built in.

**06b** (4.1s)

    Ask for one expense by its I D, and you get exactly that one.

**06c** (6.2s)

    You can also filter. Here, only Education expenses, sorted by amount, biggest first.

**06d** (4.5s)

    You can also search by text, and add date ranges or amount ranges.

**06e** (3.7s)

    And a categories endpoint tells clients which values are allowed.

## 07 - Update

**07a** (4.5s)

    Update comes in two flavours. Patch changes only the fields you send.

**07b** (2.8s)

    Here we correct the amount to forty two point five.

**07c** (5.0s)

    Put replaces the whole expense. We rename it, and set the amount to sixty.

**07d** (3.8s)

    Either way, updated at changes, and created at stays put.

## 08 - Delete

**08a** (3.5s)

    Delete removes the expense, and the row leaves the ledger.

**08b** (5.6s)

    Ask for it again, and the A P I answers four oh four: not found, with a clear message.

## 09 - Summary

**09a** (2.3s)

    The summary endpoint does the bookkeeping.

**09b** (5.8s)

    It returns the total spent, the number of expenses, the average, and a breakdown by category.

**09c** (2.6s)

    Unsurprisingly, Housing is the big one.

## 10 - Bad input

**10a** (7.7s)

    What about bad input? We send an empty title, a negative amount, an unknown category, and a date that doesn't exist.

**10b** (6.5s)

    The A P I doesn't crash, and it doesn't guess. It answers four hundred, and lists every problem at once.

**10c** (5.1s)

    Broken J S O N, or a route that doesn't exist, gets a clear error too.

## 11 - Tests

**11a** (6.2s)

    We don't trust it by eye. Fifteen automated tests cover every endpoint, including the failures.

**11b** (2.8s)

    They run in about two seconds with N P M test.

**11c** (1.3s)

    All fifteen pass.

## 12 - The team

**12a** (2.3s)

    And we built it as a team of thirteen.

**12b** (7.7s)

    Each member owned one part: setup, the data layer, validation, the controller, routes, tests, and documentation.

**12c** (6.6s)

    Everyone pushed their work to GitHub as their own commits, merged in order, so each part built on the last.

## 13 - Wrap-up

**13a** (7.1s)

    That's the Expense Tracker A P I: full CRUD, filters, a summary, validation, and fifteen passing tests.

**13b** (4.5s)

    The code is on GitHub. Thank you for watching, and we'd love your questions.
