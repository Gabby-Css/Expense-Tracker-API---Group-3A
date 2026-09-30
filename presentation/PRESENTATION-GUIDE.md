# Group 3A: how to present the Expense Tracker API

This guide follows the assignment brief step by step: what to submit, what the judges score, a
5-minute run of show, a click-by-click live demo, and Q&A answers checked against the real code.

Files that go with it (all in this `presentation/` folder):

| File | What it is |
| --- | --- |
| `Expense-Tracker-API-Group3A.pptx` | The 10-slide deck. Speaker notes on every slide carry the timing and what to say. |
| `demo-video/` | The 3 to 5 minute narrated demo video project (the rendered `.mp4` goes in `demo-video/renders/`). |
| `PRESENTATION-GUIDE.md` | This guide. |

---

## 1. What you have to hand in

From the brief:

- [ ] **Presentation slides** explaining the project, submitted as a **link** (upload the .pptx to Google Drive or OneDrive, set sharing to "anyone with the link can view", paste the link).
- [ ] **3 to 5 minute video demo** (upload the .mp4 to Drive or YouTube unlisted and submit that link).
- [ ] **Deadline: 11:59 pm, Thursday of Week 4.** Submit early. Open both links in a private window to check they work without logging in.
- [ ] **Week 4 live class:** present and demo the API on localhost. The top groups are announced.

## 2. What the judges score, and how you earn each mark

| Criterion | What earns the mark | Where it is in your talk |
| --- | --- | --- |
| **Time management** | Finish inside 5 minutes. Practise to 4:30 to 4:45 so a hiccup does not push you over. One person holds the timer and shows "1 min left". | The timing table below; every slide has a time budget in its notes. |
| **Testing of endpoints** | Show real requests and real responses, including failures. Run `npm test` and show 15 green ticks. | Live demo steps 1 to 6, then slide 8. |
| **CRUD operation** | Say the four letters out loud and demonstrate each one live: Create (POST), Read (GET), Update (PATCH/PUT), Delete (DELETE), then prove the delete with a 404. | Slide 4, then demo steps 2 to 5. |
| **Collaboration** | Name that all 13 members built it, each owning one part, merged in order on GitHub. Have more than one person speak. Be honest about the README merge conflict and how you fixed it. | Slide 9. |
| **Presentation delivery** | Talk to the class, not the slide. Short sentences. Do not read the slides. Rehearse the hand-overs between speakers. | Whole talk. |
| **Q&A handling** | Everyone knows their own part. The person who owns that part answers. If you do not know, say so and say how you would find out. | Section 6 below. |

## 3. The 5-minute run of show

Suggested speakers (your group decides who; four speakers keeps hand-overs quick):

- **Speaker 1** opens and explains the design.
- **Speaker 2** drives the live demo.
- **Speaker 3** covers tests and teamwork.
- **Speaker 4** closes and runs Q&A.

| Time | Slide | Who | What to say (one idea per slide) | What to do |
| --- | --- | --- | --- | --- |
| 0:00 | 1 Title | 1 | "We are Group 3A. This is our Expense Tracker API, built with Node.js and Express." | Say hello, then advance immediately. |
| 0:15 | 2 What we built | 1 | The problem, the solution, then point at the four numbers: 9 endpoints, 9 categories, 15 passing tests, 13 members. | |
| 0:40 | 3 How a request flows | 1 | Trace one request left to right: route, validation, controller, data file. | Use your finger or pointer along the boxes. |
| 1:05 | 4 CRUD operations | 1 to 2 | "Create is POST, Read is GET, Update is PUT or PATCH, Delete is DELETE." Tell them you will now show each one live. | Hand over to Speaker 2. |
| 1:30 | 5 Beyond CRUD | 2 | Filters combine in one URL. Minus sign sorts descending. Summary totals per category. | Quick slide. Do not linger. |
| 1:50 | 6 Bad input rejected | 2 | The API lists every error at once, not just the first. | |
| 2:10 | 7 Live demo | 2 | **Switch to Postman or the terminal now** and follow the six steps in section 4. | Server already running in a second window. |
| 3:40 | 8 Testing | 3 | "We test every endpoint, including failures." Run `npm test` if there is time (about 3 seconds). | Show 15 green ticks. |
| 4:05 | 9 Collaboration | 3 | 13 members, one part each, merged in order 1 to 13. Mention the README conflict you fixed. | |
| 4:30 | 10 Thank you | 4 | One-sentence recap, then invite questions. | Smile, stop talking, wait. |

If you are running long, cut in this order: slide 5 first, then the search example in the demo, then the PUT example.

## 4. The live demo, click by click

### Before class (10 minutes, do it twice)

1. `npm install`
2. `npm run seed` (this **replaces** everything in `data/express.json` with the 8 sample expenses, so do it before the demo, never during).
3. `npm start` in a terminal window. Leave it running. Confirm it prints `Group 3A Expense Tracker API running at http://localhost:3000`.
4. Check port 3000 is free. If `npm start` says the port is in use, close the old server first.
5. Open Postman (or the Thunder Client extension in VS Code) and create one request per step below, saved in a collection, so you only click **Send** in class.
6. Increase the font size in the terminal and in Postman so the back row can read it.
7. Keep the demo video open in another tab as **Plan B**.

**Tip for Postman:** on the Create request, open the *Tests* tab and paste this line. It saves the new expense's id so the later requests can use `{{id}}`:

```js
pm.collectionVariables.set("id", pm.response.json().data.id);
```

### The six steps (about 1 minute 30 seconds)

| Step | Say | Request | What the audience should see |
| --- | --- | --- | --- |
| 1 Health | "The server is up." | `GET http://localhost:3000/api/health` | `"status": "ok"` |
| 2 Create | "Create: we post a new expense." | `POST http://localhost:3000/api/expenses` with JSON body `{"title":"Group project printing","amount":35,"category":"Education","date":"2026-09-20"}` | **201 Created**, and a new `id` |
| 3 Read | "Read: the list, then one by id, then a filter." | `GET /api/expenses`, then `GET /api/expenses/{{id}}`, then `GET /api/expenses?category=Education&sort=-amount` | The list with `totalAmount` and paging; one record; two Education rows, biggest first |
| 4 Update | "Update: PATCH changes only what we send." | `PATCH /api/expenses/{{id}}` with `{"amount":42.5}` | Amount changed, `updatedAt` newer than `createdAt` |
| 5 Delete | "Delete, then prove it is gone." | `DELETE /api/expenses/{{id}}`, then `GET /api/expenses/{{id}}` | **404 Not Found** with a clear message |
| 6 Extras | "Totals and bad input." | `GET /api/expenses/summary`, then `POST /api/expenses` with `{"title":"","amount":-5,"category":"Gaming","date":"2026-02-30"}` | Totals by category; **400** listing all four errors |

If you prefer the terminal, use **Git Bash** (not PowerShell, where `curl` is a different command). The same requests as `curl`:

```bash
curl localhost:3000/api/health
curl -X POST localhost:3000/api/expenses -H "Content-Type: application/json" \
  -d '{"title":"Group project printing","amount":35,"category":"Education","date":"2026-09-20"}'
curl "localhost:3000/api/expenses?category=Education&sort=-amount"
curl localhost:3000/api/expenses/summary
```

### If something goes wrong

- **Server will not start:** port 3000 is busy. Stop the old process, or use another port and change the URLs. In PowerShell: `$env:PORT=3001; npm start`. In Git Bash: `PORT=3001 npm start`.
- **Empty list:** you forgot `npm run seed`. Run it, restart nothing, and resend the request.
- **Postman error:** say "let me show you the recorded version", and play the demo video from the point you need. Judges reward staying calm.

## 5. Delivery tips

- Rehearse **three times** with a timer: once to learn it, once to fix the hand-overs, once as a dress rehearsal.
- Say what you are about to do, do it, then say what happened. ("Now delete. It returns 200. Ask again: 404.")
- Do not read the slides. The slide has the picture; you say the sentence.
- Leave a full second of silence after the last line and look up. That is the signal for questions.

## 6. Q&A: likely questions, with answers that match the code

Each answer says who should take it, by the part they built (from the work division).

| Question | Answer | Part |
| --- | --- | --- |
| Why a JSON file instead of a database? | Zero setup: no database to install, so anyone can run it. All file access is in one file, `src/data/db.js` (`readAll` and `writeAll`), so switching to a real database later means changing only that file. | 2 |
| How does validation work? | The `validateExpense` middleware checks the title (required, up to 100 characters), the amount (a number above 0), the category (one of the 9), and the date (a real `YYYY-MM-DD` date, so `2026-02-30` fails). It returns 400 with a list of every error. PATCH uses the same checks with the fields optional. | 4 |
| What is the difference between PUT and PATCH? | PUT replaces the expense, so all required fields must be sent and an omitted description is cleared. PATCH changes only the fields you send. Both use the same `updateExpense` function. | 8 |
| How can a client not overwrite the `id` or `createdAt`? | The `pickFields` helper copies only title, amount, category, date and description from the request. Anything else is ignored, and a test covers it. | 5 |
| Why is `/summary` defined before `/:id`? | Express matches routes in order. If `/:id` came first, the word "summary" would be treated as an id. | 9 |
| How are ids created? | `crypto.randomUUID()` when the expense is created. | 6 |
| Which status codes do you return? | 200 OK, 201 Created for a new expense, 400 for invalid input, bad JSON or a bad filter value, and 404 for an unknown id or an unknown route. | 3, 6 |
| How does list paging work? | `page` and `limit` query parameters. The default limit is 20 and the maximum is 100. The response includes `count`, `totalItems`, `totalPages` and `totalAmount`. | 7 |
| How is the list sorted by default? | Newest expense date first (`-date`). You can also sort by `amount`, `title` or `createdAt`, and a minus sign reverses the order. | 7 |
| How do you test? | `node --test` with Supertest: 15 tests covering every endpoint and the failure cases. They use a temporary data file, so your real data is never touched. | 10 to 12 |
| What do `cors` and `morgan` do? | `cors` lets a browser front end on another address call the API. `morgan` prints one log line per request, such as `GET /api/expenses 200 2 ms`. It is switched off during tests. | 9 |
| Is it safe if two requests arrive together? | Within one server process, yes: each handler reads and writes the file synchronously, so requests do not interleave. It is **not** safe across several server processes writing the same file. A database would fix that. | 2 |
| What if the data file is corrupted? | `readAll` catches the parse error and returns an empty list instead of crashing. The honest downside: the next write would overwrite the bad file. | 2 |
| What would you add next? | Login and per-user expenses, a real database, a currency field, monthly budgets and reports, and a front end. | any |
| How did you collaborate? | 13 parts, one owner each, pushed as separate commits and merged in order 1 to 13 on GitHub. We hit a merge conflict on the README when linking the repo and resolved it by keeping our full README. | 13 |

**If you do not know an answer:** say "we did not build that, but here is how we would". Never guess.
