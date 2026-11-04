# User Stories — To-Do List App

## Product summary

The To-Do List app lets a task owner create, edit, delete, and search tasks, and see how the current week is going. Tasks belong to a date and a start time. The home screen groups the week Monday through Sunday, shows how many tasks are complete and pending, and lists the tasks for the selected day.

The interface is a mobile layout matching the reference screens: a welcome screen, a home dashboard, an add-task sheet, and a search results screen. Tasks are stored by the app’s own API. There is no sign-in.

## Persona

**Task owner** — the only user of the app. They plan work for specific days, check items off as they finish them, and look back at the week to see what is still open.

## Assumptions

- A week runs Monday through Sunday. “This week” means the Monday–Sunday week that contains today.
- **Task Complete** counts tasks in that week whose status is completed. **Task Pending** counts tasks in that week that are not completed. Pending is the same set the brief calls open or in progress.
- Weekly progress is the share of this week’s tasks that are completed. A week with no tasks shows an empty progress state, not a divide-by-zero.
- The home day strip shows the seven days of the current week and starts on Monday. Selecting a day lists only that day’s tasks.
- Date and start time are required. End time, description, and priority are optional. Priority, when set, is Low, Medium, or High.
- Create uses the **+** button and **Create task**. Edit uses the pencil icon and the same form. Delete uses the trash icon on the task row.
- Search matches the title and the description, and it is case-insensitive.
- Gear and bell icons on the add-task screen are visual only. They do not open settings or notifications.
- One task owner uses one task list. Refreshing the app reloads that list from the API.

## Out of scope

- Accounts, sign-in, and sign-out
- Settings and notification behavior behind the gear and bell icons
- Sharing a list with another person
- Reminders, recurrence, and attachments

## Stories

### Epic: Welcome

#### US-01 — Land on the welcome screen

**Story:** As a task owner, I want a welcome screen when I open the app, so that I know what the app is for before I start managing tasks.

**Acceptance criteria:**

- Given I open the app with no other screen already open, when the first screen loads, then I see the heading “Manage What To Do”.
- Given the welcome screen is showing, when I read the supporting line, then I see “The best way to manage what you have to do, don't forget your plans”.
- Given the welcome screen is showing, when I look at the primary action, then I see a **Get Started** button.

#### US-02 — Enter home from welcome

**Story:** As a task owner, I want to leave the welcome screen, so that I can see and manage my tasks.

**Acceptance criteria:**

- Given I am on the welcome screen, when I press **Get Started**, then I land on the home screen.
- Given I have already pressed **Get Started** in this visit, when I am on home, then the welcome screen is no longer showing.

### Epic: Home

#### US-03 — See the current week

**Story:** As a task owner, I want the current week laid out Monday through Sunday, so that I can move between days without leaving home.

**Acceptance criteria:**

- Given I am on home, when the day strip renders, then it shows seven days from Monday through Sunday for the week that contains today.
- Given today falls in that week, when the strip first renders, then today is the selected day.
- Given a day cell is showing, when I read it, then I can tell the weekday and the date apart from the other days.

#### US-04 — List tasks for the selected day

**Story:** As a task owner, I want the home list to follow the day I select, so that I only see the work planned for that day.

**Acceptance criteria:**

- Given I am on home and today has tasks, when the list renders, then the section title reads **Tasks Today** and each row shows that task’s title and completion checkbox.
- Given another day in the same week has tasks, when I select that day, then the list shows only tasks whose date is that day.
- Given I select a day, when a task row renders, then I can reach its checkbox, trash icon, and pencil icon.
- Given the selected day is not today, when the list renders, then it still lists only that day’s tasks.

#### US-05 — See weekly complete, pending, and progress

**Story:** As a task owner, I want this week’s completed and pending totals and a progress bar, so that I can tell how the week is going without opening every task.

**Acceptance criteria:**

- Given I am on home, when the summary renders, then I see a **Task Complete** card labeled **This Week** whose number equals the completed tasks dated Monday–Sunday of the current week.
- Given I am on home, when the summary renders, then I see a **Task Pending** card labeled **This Week** whose number equals the not-completed tasks in that same week.
- Given the current week has at least one task, when **Weekly Progress** renders, then the bar reflects completed tasks divided by all tasks in the week.
- Given I complete, reopen, create, or delete a task in the current week, when the home summary refreshes, then both cards and the progress bar match the new totals.

#### US-06 — View every task in the week

**Story:** As a task owner, I want to open the whole week from home, so that I can review more than the single selected day.

**Acceptance criteria:**

- Given I am on home, when I look at the task section, then I see a **View All** action.
- Given the current week has tasks on more than one day, when I press **View All**, then I see every task dated Monday–Sunday of the current week.
- Given the week list is open, when I read a task, then I can still check it, edit it, or delete it.
- Given I leave the week list, when I return to home, then the selected day and its day list are unchanged.

#### US-07 — See an empty day or an empty week

**Story:** As a task owner, I want a clear empty state, so that I know a quiet day or week is real and not a loading error.

**Acceptance criteria:**

- Given the selected day has no tasks, when the day list renders, then I see an empty state instead of task rows, and the **+** button remains available.
- Given the current week has no tasks, when the summary renders, then **Task Complete** and **Task Pending** both show zero and the progress bar shows an empty week.
- Given the current week has no tasks, when I press **View All**, then I see an empty week state rather than an error.

### Epic: Task status

#### US-08 — Mark a task complete or not complete

**Story:** As a task owner, I want to check and uncheck a task, so that the week’s closed count stays honest as I finish or reopen work.

**Acceptance criteria:**

- Given a task is not complete, when I check its box on the day list, the week list, or search results, then its status becomes completed.
- Given a task is completed, when I clear its box, then its status becomes not completed.
- Given I change a task in the current week, when the change is saved, then **Task Complete**, **Task Pending**, and **Weekly Progress** update immediately.
- Given I complete a task, when I look at that row, then the checked state stays on that task and does not change any other task.

### Epic: Create task

#### US-09 — Open the add-task sheet

**Story:** As a task owner, I want an add-task sheet from home, so that I can capture a task without hunting for a menu.

**Acceptance criteria:**

- Given I am on home, when I look at the screen, then a **+** button is available.
- Given I press **+**, when the sheet opens, then I see the title **Add New Task**, a task title field, **Start** and **Ends** time fields, a date field, a description field, a priority choice of Low, Medium, or High, a **Create task** button, and a close control.
- Given the sheet just opened, when I read the fields, then title, start time, end time, description, and priority are empty, the date shows the day selected on home, and I can change that date before saving.

#### US-10 — Save a task onto its day and week

**Story:** As a task owner, I want to save a task with a title, date, and start time, so that it shows up on the day I planned.

**Acceptance criteria:**

- Given the add sheet is open, when I enter a title, a date, and a start time, and I press **Create task**, then the sheet closes and the task exists.
- Given the new task’s date is the selected day, when home renders, then the task appears in that day’s list.
- Given the new task’s date is another day in the visible week, when I select that day, then the task appears there.
- Given the new task falls in the current week, when the summary renders, then the pending count includes it and the progress bar includes it as not completed.
- Given I also enter an end time, a description, or a priority, when I save, then those values are stored on the task.
- Given I omit the end time, description, and priority, when I save with title, date, and start time, then the task is still created.

#### US-11 — Block an incomplete task

**Story:** As a task owner, I want the app to refuse a task that has no title, date, or start time, so that every saved task can be placed on the calendar.

**Acceptance criteria:**

- Given the add sheet is open, when title, date, or start time is missing and I press **Create task**, then the task is not created and the sheet stays open.
- Given a required field is missing, when save is blocked, then I can tell which of title, date, and start time still need a value.
- Given save was blocked, when I fill the missing required fields and press **Create task**, then the task is created.

#### US-12 — Dismiss the add sheet without saving

**Story:** As a task owner, I want to close the add sheet, so that I can abandon a draft without creating a task.

**Acceptance criteria:**

- Given the add sheet is open and I have typed something, when I press the close control, then the sheet closes and no task is created.
- Given I close a draft, when I open **+** again, then the fields are empty again.

### Epic: Edit task

#### US-13 — Change a task and save it

**Story:** As a task owner, I want to edit a task from its pencil icon, so that I can fix the title, schedule, details, or priority without creating a duplicate.

**Acceptance criteria:**

- Given a task is visible on the day list, the week list, or search results, when I press its pencil icon, then the task form opens with that task’s title, start time, end time, date, description, and priority filled in.
- Given the form is open for an existing task, when I change any of those fields and save, then the same task is updated and a second task is not created.
- Given I change the date to another day, when I save, then the task leaves the old day and appears on the new day.
- Given the new date is in a different Monday–Sunday week, when I save, then the old week’s counts drop that task and the new week’s counts include it.
- Given I clear the optional end time, description, or priority and save, when I open the task again, then those optional values are empty and the title, date, and start time remain.

### Epic: Delete task

#### US-14 — Remove a task

**Story:** As a task owner, I want to delete a task from its trash icon, so that cancelled work leaves my list and my weekly counts.

**Acceptance criteria:**

- Given a task row is showing on the day list, the week list, or search results, when I press its trash icon, then that task is removed.
- Given the task was on the selected day, when the list refreshes, then that row is gone and other tasks remain.
- Given the deleted task was in the current week, when the summary refreshes, then the complete or pending count drops by one and the progress bar is recalculated.
- Given I search for the deleted task’s title, when results render, then that task is not listed.

### Epic: Search

#### US-15 — Search by title or description

**Story:** As a task owner, I want to search from home, so that I can find a task by words in its title or description.

**Acceptance criteria:**

- Given I am on home, when I look at the top of the screen, then I see a search field with the placeholder “Search for a task”.
- Given I enter a keyword, when results render, then I see a search screen with a back control, the query I typed, and one row per matching task.
- Given a task’s title or description contains the keyword, ignoring letter case, when I search, then that task is included.
- Given a task does not contain the keyword in its title or description, when I search, then that task is excluded.
- Given several tasks match, when the list renders, then each row shows the task title and its completion checkbox.

#### US-16 — Update a task from search results

**Story:** As a task owner, I want to complete, edit, or delete a task from search, so that finding a task is enough to act on it.

**Acceptance criteria:**

- Given a result row is showing, when I check or uncheck it, then that task’s status changes and weekly counts stay in agreement with US-08.
- Given a result row is showing, when I press its pencil icon, then I can edit and save that task as in US-13.
- Given a result row is showing, when I press its trash icon, then that task is deleted as in US-14 and disappears from the results.

#### US-17 — Leave search when nothing matches or I am done

**Story:** As a task owner, I want an obvious way back when a search misses or I am finished, so that I return to the list I was using.

**Acceptance criteria:**

- Given the query matches nothing, when results render, then I see a no-matches state and no task rows.
- Given I am on the search screen, when I press the back control, then I return to the previous screen and the day I had selected is unchanged.
- Given I clear the query, when the search field is empty, then I am no longer looking at a filtered result list.

### Epic: Persistence

#### US-18 — Keep tasks after a refresh

**Story:** As a task owner, I want my tasks to remain after I refresh the app, so that planning I already saved is still there.

**Acceptance criteria:**

- Given I create a task, when I refresh the app, then that task is still present with the same title, date, start time, end time, description, priority, and status.
- Given I edit a task, when I refresh, then the saved values are the edited ones.
- Given I complete or reopen a task, when I refresh, then the status and the weekly counts match that status.
- Given I delete a task, when I refresh, then the task is still gone.
- Given the app loads tasks, when they appear, then they were read from the app’s own API rather than typed in as a fixed sample list.
