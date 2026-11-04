# Audit Report — To-Do List App

**Date:** 5 November 2026
**Scope:** All 18 user stories in [USER_STORIES.md](USER_STORIES.md) (66 acceptance criteria), checked against the code described in [ARCHITECTURE.md](ARCHITECTURE.md)
**Result:** 65 of 66 criteria pass. 1 is partial (US-13). There are 2 medium and 5 low findings, plus advisory notes.

## Summary

Every story is implemented, and 65 of the 66 acceptance criteria pass. One criterion in US-13 passes only in part. When a task is moved to another week, it correctly leaves the current week, but the app has no way to view any week except the current one. So "the new week's counts include it" can only be confirmed through the API, not in the UI.

The automated suite passes in full: 90 tests (11 API and 79 client). Live checks against the running API and MongoDB confirmed persistence (US-18). They also turned up two API validation gaps the tests don't cover: impossible calendar dates are accepted, and an end time before the start time is accepted.

| Status | Stories | Criteria |
| --- | --- | --- |
| Pass | 17 | 65 |
| Partial | 1 (US-13) | 1 |
| Fail | 0 | 0 |

## How the audit was done

1. **Automated tests.** I ran `npm test` from the repository root.
   - Server: Vitest and Supertest against an in-memory MongoDB, 11 tests.
   - Client: Vitest, jsdom and Testing Library, rendering the whole app against an in-memory fake of the task API with a fixed date of Thursday 5 November 2026, 79 tests.
   - Result: 90 passed, 0 failed, no React `act()` warnings.
2. **Criteria mapping.** I matched each criterion to the test that proves it, or to a live check where no test covers it. Client test `describe` blocks are named after their stories.
3. **Live API checks.** I sent requests to the running Express API (port 5050) backed by MongoDB 7 in Docker. This covered the full create, read, update and delete cycle plus 14 edge-case requests.
4. **Live browser checks.** I used the running client (Vite, port 5174) to confirm that ticking and deleting tasks survive a page reload. I only touched audit tasks that I created and then removed. Existing tasks, including ones added by the user, were left alone.
5. **Code review.** I read the client and server source for behaviour the tests don't reach, such as concurrency, accessibility and validation.
6. **Dependency audit.** I ran `npm audit` with and without development packages.

Test files referenced below live in `client/src/pages/` unless a path is given.

## Results by story

### US-01 — Land on the welcome screen: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Heading "Manage What To Do" | Pass | `Welcome.test.jsx` › US-01 |
| 2 | Supporting line text | Pass | `Welcome.test.jsx` › US-01 |
| 3 | **Get Started** button | Pass | `Welcome.test.jsx` › US-01 |

### US-02 — Enter home from welcome: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | **Get Started** opens home | Pass | `Welcome.test.jsx` › US-02 |
| 2 | Welcome no longer showing on home | Pass | `Welcome.test.jsx` › US-02. Navigation uses `replace`, so browser Back does not return to welcome; this was confirmed live, not by a test. |

### US-03 — See the current week: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Seven days, Monday to Sunday, of this week | Pass | `Home.test.jsx` › US-03, including Sunday and a month or year boundary in `lib/week.test.js` |
| 2 | Today selected on first render | Pass | `Home.test.jsx` › US-03 |
| 3 | Weekday and date distinguishable | Pass | `Home.test.jsx` › US-03 (labels such as "Thu 5, today") |

The week also moves forward correctly when the date rolls over while the app is open, and the selected day is kept on an ordinary window focus (`Home.test.jsx` › US-03, `HomeWeek.test.jsx` › Selected day and window focus).

### US-04 — List tasks for the selected day: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | **Tasks Today** with title and checkbox per row | Pass | `Home.test.jsx` › US-04 |
| 2 | Another day shows only that day's tasks | Pass | `Home.test.jsx` › US-04 |
| 3 | Checkbox, trash and pencil reachable | Pass | `Home.test.jsx` › US-04 (keyboard Tab order) |
| 4 | A day other than today still lists only that day | Pass | `Home.test.jsx` › US-04 |

### US-05 — See weekly complete, pending and progress: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | **Task Complete** equals this week's completed tasks | Pass | `Home.test.jsx` › US-05 (tasks from other weeks are excluded) |
| 2 | **Task Pending** equals this week's open tasks | Pass | `Home.test.jsx` › US-05 |
| 3 | Progress equals completed divided by all | Pass | `Home.test.jsx` › US-05, and `summarize` in `lib/week.test.js` |
| 4 | Cards and bar match after complete, reopen, create or delete | Pass | `TaskStatus.test.jsx`, `TaskForm.test.jsx` › US-10, `DeleteTask.test.jsx`, `Home.test.jsx` › refresh on focus |

While data is loading, or if loading fails, the cards show `--` rather than a false zero (`Home.test.jsx` › US-05).

### US-06 — View every task in the week: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | **View All** visible | Pass | `HomeWeek.test.jsx` › US-06 |
| 2 | All Monday–Sunday tasks shown, grouped by day | Pass | `HomeWeek.test.jsx` › US-06 (tasks from last and next week are excluded) |
| 3 | Check, edit and delete work from the week list | Pass | `HomeWeek.test.jsx` › US-06 |
| 4 | Leaving the week list restores the selected day | Pass | `HomeWeek.test.jsx` › US-06 |

### US-07 — See an empty day or an empty week: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Empty day message, and **+** still available | Pass | `HomeWeek.test.jsx` › US-07 |
| 2 | Empty week shows zeros and an empty bar | Pass | `HomeWeek.test.jsx` › US-07, `Home.test.jsx` › US-05 |
| 3 | **View All** on an empty week shows an empty state, not an error | Pass | `HomeWeek.test.jsx` › US-07 |

### US-08 — Mark a task complete or not complete: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Checking completes the task (day list, week list, search) | Pass | `TaskStatus.test.jsx`, `HomeWeek.test.jsx` › US-06, `Search.test.jsx` › US-16 |
| 2 | Unchecking reopens the task | Pass | `TaskStatus.test.jsx` |
| 3 | Counts and progress update immediately | Pass | `TaskStatus.test.jsx` |
| 4 | Only the clicked task changes | Pass | `TaskStatus.test.jsx` |

The title is struck through when a task is checked, and a failed save puts the checkbox back and shows an explanation (`TaskStatus.test.jsx`).

### US-09 — Open the add-task sheet: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | **+** button on home | Pass | `HomeWeek.test.jsx` › US-07, `TaskForm.test.jsx` › US-09 |
| 2 | All fields, Low/Medium/High priority, **Create task**, close | Pass | `TaskForm.test.jsx` › US-09 |
| 3 | Fields start empty, date is the selected day and can be changed | Pass | `TaskForm.test.jsx` › US-09 |

### US-10 — Save a task onto its day and week: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Sheet closes and the task exists | Pass | `TaskForm.test.jsx` › US-10 |
| 2 | Appears in the selected day's list | Pass | `TaskForm.test.jsx` › US-10 |
| 3 | Appears on another day of the week when that day is selected | Pass | `TaskForm.test.jsx` › US-10 |
| 4 | Counted as pending, progress recalculated | Pass | `TaskForm.test.jsx` › US-10 |
| 5 | End time, description and priority stored | Pass | `TaskForm.test.jsx` › US-10 (checks the exact request body) |
| 6 | Created with only title, date and start time | Pass | `TaskForm.test.jsx` › US-10 |

### US-11 — Block an incomplete task: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Not created and the sheet stays open | Pass | `TaskForm.test.jsx` › US-11 (no request is sent) |
| 2 | Each missing field is named | Pass | `TaskForm.test.jsx` › US-11 (an error message is linked to each missing field) |
| 3 | Filling the missing fields allows creation | Pass | `TaskForm.test.jsx` › US-11 |

A title made only of spaces counts as missing. The API also rejects missing fields on its own (`server/test/tasks.test.js`).

### US-12 — Dismiss the add sheet without saving: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Close discards the draft | Pass | `TaskForm.test.jsx` › US-12 (Escape also closes) |
| 2 | Reopening starts empty | Pass | `TaskForm.test.jsx` › US-12 |

### US-13 — Change a task and save it: Partial

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Pencil opens the form filled with the task's values | Pass | `TaskForm.test.jsx` › US-13 (day list) and `Search.test.jsx` › US-16 (search). From the week list, the test only confirms the form opens, not its values. |
| 2 | Saves the same task, with no duplicate | Pass | `TaskForm.test.jsx` › US-13 |
| 3 | A new date moves the task to the new day | Pass | `TaskForm.test.jsx` › US-13 |
| 4 | Moving to another week drops it from the old week's counts and adds it to the new week's | **Partial** | The old week's counts drop correctly (`TaskForm.test.jsx` › US-13). The app cannot show any week other than the current one, so the new week's counts can only be checked through the API (`GET /api/tasks?from=&to=`). See finding F-1. |
| 5 | Clearing optional fields keeps the required ones | Pass | `TaskForm.test.jsx` › US-13; confirmed live through `PATCH` |

### US-14 — Remove a task: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Trash removes the task (day list, week list, search) | Pass | `DeleteTask.test.jsx`, `HomeWeek.test.jsx` › US-06, `Search.test.jsx` › US-16 |
| 2 | Other rows remain | Pass | `DeleteTask.test.jsx` |
| 3 | Complete or pending count drops by one, progress recalculated | Pass | `DeleteTask.test.jsx` |
| 4 | A deleted task no longer appears in search | Pass | `DeleteTask.test.jsx` |

### US-15 — Search by title or description: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Search field with the placeholder "Search for a task" | Pass | `Search.test.jsx` › US-15 |
| 2 | Search screen with a back control, the query, and one row per match | Pass | `Search.test.jsx` › US-15 |
| 3 | Title or description matches, ignoring case | Pass | `Search.test.jsx` › US-15; API search in `server/test/tasks.test.js` |
| 4 | Non-matching tasks excluded | Pass | `Search.test.jsx` › US-15 |
| 5 | Each row shows the title and checkbox | Pass | `Search.test.jsx` › US-15 |

Search runs across all weeks. Special regular-expression characters are escaped by the API: a live search for `.*` returned no rows instead of matching everything.

### US-16 — Update a task from search results: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Toggling from a result, and the home counts agree | Pass | `Search.test.jsx` › US-16 |
| 2 | Edit from a result | Pass | `Search.test.jsx` › US-16 (a result that stops matching after the edit leaves the list) |
| 3 | Delete from a result | Pass | `Search.test.jsx` › US-16 |

### US-17 — Leave search when nothing matches or I am done: Pass

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | No-matches state with no rows | Pass | `Search.test.jsx` › US-17 |
| 2 | Back returns with the same selected day | Pass | `Search.test.jsx` › US-17 (a search opened directly goes back to home) |
| 3 | Clearing the query removes the filtered list | Pass | `Search.test.jsx` › US-17 |

### US-18 — Keep tasks after a refresh: Pass

No automated UI test covers this story; see F-7. It was verified live against MongoDB.

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Created task keeps all fields | Pass | Live: `POST`, then `GET` returned the same title, description, date, start, end, priority and status |
| 2 | Edits persist | Pass | Live: `PATCH`, then the response and the following reads showed the edited values |
| 3 | Completion persists, and counts match | Pass | Live in the browser: ticked an audit task, reloaded, and it was still ticked |
| 4 | Deletion persists | Pass | Live in the browser: deleted the audit task, reloaded, and it was gone. `GET` for an unknown id returns 404. |
| 5 | Tasks come from the app's API, not a fixed list | Pass | Sample task titles appear only in test files. The client loads tasks with `GET /api/tasks`. |

## Findings

| ID | Severity | Area | Finding |
| --- | --- | --- | --- |
| F-1 | Medium | Product / US-13 | Only the current week can be viewed |
| F-2 | Medium | API validation | Impossible calendar dates are accepted |
| F-3 | Low | Validation | End time can be earlier than start time |
| F-4 | Low | API validation | Loose true/false handling for `completed` |
| F-5 | Low | Accessibility | The task sheet does not keep keyboard focus inside it |
| F-6 | Low | UX | Delete happens immediately, with no confirmation or undo |
| F-7 | Low | Reliability | Overlapping updates can briefly show an old state |
| F-8 | Info | Dependencies | Known advisories in React Router (runtime) and Vite/Vitest (development only) |
| F-9 | Info | Brief compliance | Differences from the SDE-1 brief |
| F-10 | Info | Test coverage | Gaps in automated coverage |

### F-1 — Only the current week can be viewed (Medium)

The day strip, the summary cards and **View All** always show the week that contains today. A task moved to a later week leaves the current view, which is correct, but nothing in the UI shows it in its new week. That is why US-13 criterion 4 is only partial.

The SDE-1 brief (section 3.2) also asks for tasks "grouped and displayed by week", with a card per week that expands. The user stories narrowed this to the current week; see the assumptions in USER_STORIES.md.

**Recommendation:** Add previous and next week controls to the day strip. Pass the chosen week to `useWeekTasks`, which already accepts any `from`/`to` range. Record the change as a new story or an amendment to US-03 and US-05.

### F-2 — Impossible calendar dates are accepted (Medium)

`server/src/models/Task.js` only checks that a date has the `YYYY-MM-DD` shape. A live `POST` with `"date": "2026-02-31"` returned 201 and was stored. On the client, `fromISODate` rolls that date over to 3 March, so headings and grouping would show the wrong day.

The UI's date picker cannot produce such a value, so this only happens through direct API calls. The test record was deleted after the check.

**Recommendation:** Add a schema validator that parses the date and checks that the year, month and day survive the round trip. Add a server test for it.

### F-3 — End time can be earlier than start time (Low)

A live `PATCH` with `startTime: "18:00"` and `endTime: "08:00"` was accepted. The task sheet does not check this either.

It may be intended, for example a task that runs past midnight, but the stories do not say.

**Recommendation:** Make a product decision. If an end time must come after the start time, add the rule to `TaskSheet` and the schema, and add it to the US-10 and US-11 criteria.

### F-4 — Loose true/false handling for `completed` (Low)

Mongoose turns strings such as `"yes"` into `true`. A live `PATCH` with `"completed": "yes"` returned 200. The client always sends real true/false values, so the impact is limited to other API callers.

**Recommendation:** Reject non-boolean values in the route, or with a custom validator, so API errors stay predictable.

### F-5 — The task sheet does not keep keyboard focus inside it (Low)

`components/TaskSheet.jsx` marks itself as a modal dialog (`aria-modal="true"`). It focuses the title field when it opens and returns focus when it closes. However, pressing Tab past the last control moves focus to the page behind the sheet, and the page behind is not marked as inert.

**Recommendation:** Keep Tab and Shift+Tab inside the dialog, or mark the main content `inert` while the sheet is open.

### F-6 — Delete happens immediately, with no confirmation or undo (Low)

The trash icon deletes on a single tap and sits right next to the pencil icon. This matches the stories and the mock, but an accidental tap cannot be undone.

**Recommendation:** Add an "Undo" message that holds the delete for a few seconds, or a confirmation step. Either needs a story change.

### F-7 — Overlapping updates can briefly show an old state (Low)

`hooks/useTaskMutations.js` changes the checkbox at once, then applies the server's response when it arrives. Two quick toggles on the same task can return out of order. A quiet focus refresh in `useWeekTasks` can also replace the list while a save is still in flight.

The server ends with the last request it handled, but the screen may briefly show a different state until the next refresh. This is not covered by tests.

**Recommendation:** Ignore any server response other than the latest one for each task, or block the checkbox while its save is pending.

### F-8 — Dependency advisories (Info)

`npm audit --omit=dev` reports 2 moderate advisories in `react-router` / `react-router-dom` 6.x:

- An open redirect through a backslash in `<Link>` / `useNavigate`.
- An issue in server-side rendering hydration.

The app only navigates to fixed internal paths, with search queries URL-encoded, and does not use server-side rendering, so exposure is low. The fix requires React Router 7, which is a breaking upgrade.

The full `npm audit` also reports `vite` (high), and `vitest` and `tinypool` (critical). These affect the development server and the test runner only and are not part of the production bundle.

**Recommendation:** Plan upgrades to Vite 6 or later, Vitest 3 or later, and React Router 7 in a separate change, and rerun the full suite afterwards.

### F-9 — Differences from the SDE-1 brief (Info)

These follow decisions recorded in USER_STORIES.md, but reviewers comparing against the brief should know about them:

- **Weekly grouping:** only the current week is shown. See F-1.
- **Delete gesture:** the brief says "swipe left, then tap". The app uses the trash icon from the mock.
- **Save button:** the brief says "Save". The sheet uses **Create task** (from the mock) and **Save changes** when editing.
- **Deployment:** the brief asks for a deployed client (Netlify) and API. Deployment is documented in ARCHITECTURE.md but not done.

### F-10 — Gaps in automated coverage (Info)

All 66 criteria have evidence, but some rely on live checks or partial tests:

- **US-18:** no automated test runs through the UI against a real database. Persistence is covered by the API tests and the live checks in this audit. Consider a browser end-to-end test (for example with Playwright) against the Docker database.
- **US-02, browser Back:** that Back does not return to the welcome screen was confirmed live but is not tested.
- **US-13, week list:** the test checks that the edit form opens from the week list, but not that its fields are filled in.
- **Failure paths in search:** a failed toggle or delete from search results is not tested separately. It shares `useTaskMutations` with home, where those paths are tested.

## Environment notes

- Checks ran with Node 22.15, npm 11.3 and MongoDB 7 in Docker (`npm run db:up`).
- Another Node process on this machine already uses ports 5000 and 5173. For the audit, the API ran on port 5050 (`PORT=5050`) and Vite on port 5174, with `API_PROXY_TARGET=http://localhost:5050`. This does not affect the results, but anyone running the app locally on this machine needs the same overrides while that process is running.
- All records created for the audit were deleted afterwards.
