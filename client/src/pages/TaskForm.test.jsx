import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubTaskApi } from '../test/fakeApi.js';
import { dayButton, listedTitles, renderApp, setToday, taskSection } from '../test/renderApp.jsx';

const TASKS = [
  { title: 'Finishing Wireframe', date: '2026-11-05', startTime: '09:00' },
  {
    title: 'Meeting with team',
    description: 'Weekly sync',
    date: '2026-11-05',
    startTime: '11:30',
    endTime: '12:00',
    priority: 'medium',
  },
  { title: 'Buy a cat food', date: '2026-11-05', startTime: '18:00', completed: true },
];

async function openHome(tasks = TASKS) {
  setToday('2026-11-05');
  const api = stubTaskApi(tasks);
  renderApp('/home');
  await screen.findByLabelText('Finishing Wireframe');
  return api;
}

async function openAddSheet() {
  await userEvent.click(screen.getByRole('button', { name: 'Add task' }));
  return screen.getByRole('dialog', { name: 'Add New Task' });
}

function setField(dialog, label, value) {
  fireEvent.change(within(dialog).getByLabelText(label), { target: { value } });
}

describe('US-09 Open the add-task sheet', () => {
  it('shows every field, the priority choices, Create task, and a close control', async () => {
    await openHome();
    const dialog = await openAddSheet();

    for (const label of ['Task title', 'Start', 'Ends', 'Set Date', 'Description']) {
      expect(within(dialog).getByLabelText(label)).toBeInTheDocument();
    }
    const priority = within(dialog).getByRole('group', { name: 'Priority' });
    expect(within(priority).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Low',
      'Medium',
      'High',
    ]);
    expect(within(dialog).getByRole('button', { name: 'Create task' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('starts empty with the date set to the day selected on home, and the date can change', async () => {
    await openHome();
    await userEvent.click(dayButton('Sat 7'));
    const dialog = await openAddSheet();

    expect(within(dialog).getByLabelText('Task title')).toHaveValue('');
    expect(within(dialog).getByLabelText('Start')).toHaveValue('');
    expect(within(dialog).getByLabelText('Ends')).toHaveValue('');
    expect(within(dialog).getByLabelText('Description')).toHaveValue('');
    for (const button of within(within(dialog).getByRole('group', { name: 'Priority' })).getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-pressed', 'false');
    }
    expect(within(dialog).getByLabelText('Set Date')).toHaveValue('2026-11-07');

    setField(dialog, 'Set Date', '2026-11-08');
    expect(within(dialog).getByLabelText('Set Date')).toHaveValue('2026-11-08');
  });
});

describe('US-10 Save a task onto its day and week', () => {
  it('creates a task on the selected day, closes the sheet, and counts it as pending', async () => {
    const { store } = await openHome();
    const dialog = await openAddSheet();

    await userEvent.type(within(dialog).getByLabelText('Task title'), 'Doing Homework');
    setField(dialog, 'Start', '16:00');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(store.find('Doing Homework')).toMatchObject({ date: '2026-11-05', startTime: '16:00' });
    expect(listedTitles(taskSection())).toContain('Doing Homework');
    expect(screen.getByRole('group', { name: 'Task Pending: 3 this week' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
  });

  it('puts a task for another day of the week on that day', async () => {
    await openHome();
    const dialog = await openAddSheet();

    await userEvent.type(within(dialog).getByLabelText('Task title'), 'Grocery run');
    setField(dialog, 'Start', '08:30');
    setField(dialog, 'Set Date', '2026-11-08');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create task' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(listedTitles(taskSection())).not.toContain('Grocery run');
    await userEvent.click(dayButton('Sun 8'));
    expect(listedTitles(taskSection())).toEqual(['Grocery run']);
  });

  it('stores the optional end time, description, and priority when given', async () => {
    const { callsTo } = await openHome();
    const dialog = await openAddSheet();

    await userEvent.type(within(dialog).getByLabelText('Task title'), 'Review pull requests');
    setField(dialog, 'Start', '10:00');
    setField(dialog, 'Ends', '11:15');
    await userEvent.type(within(dialog).getByLabelText('Description'), 'Client and API repos');
    await userEvent.click(within(dialog).getByRole('button', { name: 'High' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(callsTo('POST')).toHaveLength(1));
    expect(JSON.parse(callsTo('POST')[0][1].body)).toEqual({
      title: 'Review pull requests',
      description: 'Client and API repos',
      date: '2026-11-05',
      startTime: '10:00',
      endTime: '11:15',
      priority: 'high',
    });
  });

  it('creates a task with only title, date, and start time', async () => {
    const { callsTo } = await openHome();
    const dialog = await openAddSheet();

    await userEvent.type(within(dialog).getByLabelText('Task title'), 'Quick call');
    setField(dialog, 'Start', '13:00');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(callsTo('POST')).toHaveLength(1));
    expect(JSON.parse(callsTo('POST')[0][1].body)).toMatchObject({ endTime: null, priority: null, description: '' });
    expect(await screen.findByLabelText('Quick call')).toBeInTheDocument();
  });
});

describe('US-11 Block an incomplete task', () => {
  it('keeps the sheet open and names every missing required field', async () => {
    const { callsTo } = await openHome();
    const dialog = await openAddSheet();
    setField(dialog, 'Set Date', '');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Create task' }));

    expect(screen.getByRole('dialog', { name: 'Add New Task' })).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Task title')).toHaveAccessibleDescription('Enter a task title');
    expect(within(dialog).getByLabelText('Start')).toHaveAccessibleDescription('Choose a start time');
    expect(within(dialog).getByLabelText('Set Date')).toHaveAccessibleDescription('Choose a date');
    expect(within(dialog).getByLabelText('Task title')).toHaveAttribute('aria-invalid', 'true');
    expect(callsTo('POST')).toHaveLength(0);
  });

  it('treats a title of only spaces as missing', async () => {
    const { callsTo } = await openHome();
    const dialog = await openAddSheet();

    await userEvent.type(within(dialog).getByLabelText('Task title'), '   ');
    setField(dialog, 'Start', '09:00');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create task' }));

    expect(within(dialog).getByText('Enter a task title')).toBeInTheDocument();
    expect(within(dialog).queryByText('Choose a start time')).not.toBeInTheDocument();
    expect(callsTo('POST')).toHaveLength(0);
  });

  it('creates the task once the missing fields are filled', async () => {
    const { store } = await openHome();
    const dialog = await openAddSheet();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create task' }));
    expect(within(dialog).getByText('Enter a task title')).toBeInTheDocument();

    await userEvent.type(within(dialog).getByLabelText('Task title'), 'Fixed task');
    setField(dialog, 'Start', '15:00');
    expect(within(dialog).queryByText('Enter a task title')).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(store.find('Fixed task')).toBeDefined();
  });
});

describe('US-12 Dismiss the add sheet without saving', () => {
  it('closes a draft without creating a task, and reopens empty', async () => {
    const { callsTo } = await openHome();
    let dialog = await openAddSheet();
    await userEvent.type(within(dialog).getByLabelText('Task title'), 'Half-typed draft');
    setField(dialog, 'Start', '09:00');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(callsTo('POST')).toHaveLength(0);
    expect(screen.queryByLabelText('Half-typed draft')).not.toBeInTheDocument();

    dialog = await openAddSheet();
    expect(within(dialog).getByLabelText('Task title')).toHaveValue('');
    expect(within(dialog).getByLabelText('Start')).toHaveValue('');
  });

  it('also closes with the Escape key', async () => {
    await openHome();
    await openAddSheet();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('US-13 Change a task and save it', () => {
  it("opens the form filled with the task's values", async () => {
    await openHome();

    await userEvent.click(screen.getByRole('button', { name: 'Edit Meeting with team' }));

    const dialog = screen.getByRole('dialog', { name: 'Edit Task' });
    expect(within(dialog).getByLabelText('Task title')).toHaveValue('Meeting with team');
    expect(within(dialog).getByLabelText('Start')).toHaveValue('11:30');
    expect(within(dialog).getByLabelText('Ends')).toHaveValue('12:00');
    expect(within(dialog).getByLabelText('Set Date')).toHaveValue('2026-11-05');
    expect(within(dialog).getByLabelText('Description')).toHaveValue('Weekly sync');
    expect(within(dialog).getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates the same task instead of creating a second one', async () => {
    const { store, callsTo } = await openHome();
    const id = store.find('Finishing Wireframe').id;

    await userEvent.click(screen.getByRole('button', { name: 'Edit Finishing Wireframe' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Task' });
    const title = within(dialog).getByLabelText('Task title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Finish wireframe v2');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(callsTo('POST')).toHaveLength(0);
    expect(store.tasks).toHaveLength(3);
    expect(store.tasks.find((task) => task.id === id).title).toBe('Finish wireframe v2');
    expect(listedTitles(taskSection())).toEqual(['Finish wireframe v2', 'Meeting with team', 'Buy a cat food']);
  });

  it('moves the task to its new day', async () => {
    await openHome();

    await userEvent.click(screen.getByRole('button', { name: 'Edit Finishing Wireframe' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Task' });
    setField(dialog, 'Set Date', '2026-11-06');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(listedTitles(taskSection())).not.toContain('Finishing Wireframe');
    await userEvent.click(dayButton('Fri 6'));
    expect(listedTitles(taskSection())).toEqual(['Finishing Wireframe']);
  });

  it("drops the task from this week's counts when it moves to another week", async () => {
    const { store } = await openHome();
    expect(screen.getByRole('group', { name: 'Task Pending: 2 this week' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Edit Finishing Wireframe' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Task' });
    setField(dialog, 'Set Date', '2026-11-12');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(screen.getByRole('group', { name: 'Task Pending: 1 this week' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(store.find('Finishing Wireframe').date).toBe('2026-11-12');
  });

  it('clears the optional values and keeps the required ones', async () => {
    const { store } = await openHome();

    await userEvent.click(screen.getByRole('button', { name: 'Edit Meeting with team' }));
    let dialog = screen.getByRole('dialog', { name: 'Edit Task' });
    setField(dialog, 'Ends', '');
    await userEvent.clear(within(dialog).getByLabelText('Description'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Medium' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(store.find('Meeting with team')).toMatchObject({
      endTime: null,
      description: '',
      priority: null,
      date: '2026-11-05',
      startTime: '11:30',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Edit Meeting with team' }));
    dialog = screen.getByRole('dialog', { name: 'Edit Task' });
    expect(within(dialog).getByLabelText('Ends')).toHaveValue('');
    expect(within(dialog).getByLabelText('Description')).toHaveValue('');
    expect(within(dialog).getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(dialog).getByLabelText('Task title')).toHaveValue('Meeting with team');
    expect(within(dialog).getByLabelText('Start')).toHaveValue('11:30');
  });
});
