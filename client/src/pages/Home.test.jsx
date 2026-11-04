import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home.jsx';
import { jsonResponse, stubTaskApi } from '../test/fakeApi.js';

const WEEK_TASKS = [
  { title: 'Finishing Wireframe', date: '2026-11-05', startTime: '09:00' },
  { title: 'Meeting with team', date: '2026-11-05', startTime: '11:30' },
  { title: 'Buy a cat food', date: '2026-11-05', startTime: '18:00', completed: true },
  { title: 'Review pull requests', date: '2026-11-07', startTime: '10:00' },
  { title: 'Doing Homework', date: '2026-11-07', startTime: '16:00', completed: true },
  { title: 'Grocery run', date: '2026-11-02', startTime: '08:30', completed: true },
  { title: 'Last week task', date: '2026-11-01', startTime: '08:00', completed: true },
  { title: 'Next week task', date: '2026-11-09', startTime: '08:00' },
];

function setToday(iso, time = '10:00') {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${iso}T${time}:00`));
}

function renderHome() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Home />
    </MemoryRouter>,
  );
}

function dayButtons() {
  return within(screen.getByRole('group', { name: 'Days of this week' })).getAllByRole('button');
}

function taskTitles() {
  return within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((item) => within(item).getByRole('checkbox').labels[0].textContent);
}

describe('US-03 See the current week', () => {
  it('shows Monday through Sunday of the week containing today with today selected', async () => {
    setToday('2026-11-05');
    const { fetchMock } = stubTaskApi(WEEK_TASKS);
    renderHome();

    const buttons = dayButtons();
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Mon 2',
      'Tue 3',
      'Wed 4',
      'Thu 5, today',
      'Fri 6',
      'Sat 7',
      'Sun 8',
    ]);
    expect(buttons[3]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[3]).toHaveAttribute('aria-current', 'date');
    expect(buttons.filter((button) => button.getAttribute('aria-pressed') === 'true')).toHaveLength(1);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(String(fetchMock.mock.calls[0][0])).toContain('from=2026-11-02&to=2026-11-08');
  });

  it('treats Sunday as the last day of the week that started on Monday', () => {
    setToday('2026-11-08');
    stubTaskApi([]);
    renderHome();

    const buttons = dayButtons();
    expect(buttons[0]).toHaveAccessibleName('Mon 2');
    expect(buttons[6]).toHaveAccessibleName('Sun 8, today');
    expect(buttons[6]).toHaveAttribute('aria-pressed', 'true');
  });

  it('moves to the new week when the date rolls over while the app is open', async () => {
    setToday('2026-11-08', '23:59');
    const { fetchMock } = stubTaskApi(WEEK_TASKS);
    renderHome();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    vi.setSystemTime(new Date('2026-11-09T08:00:00'));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => expect(dayButtons()[0]).toHaveAccessibleName('Mon 9, today'));
    expect(dayButtons()[0]).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('from=2026-11-09&to=2026-11-15'))).toBe(true),
    );
    expect(await screen.findByLabelText('Next week task')).toBeInTheDocument();
  });
});

describe('US-04 List tasks for the selected day', () => {
  it("lists today's tasks under Tasks Today with a checkbox, delete, and edit per row", async () => {
    setToday('2026-11-05');
    stubTaskApi(WEEK_TASKS);
    renderHome();

    expect(screen.getByRole('heading', { name: 'Tasks Today' })).toBeInTheDocument();
    await screen.findByLabelText('Finishing Wireframe');
    expect(taskTitles()).toEqual(['Finishing Wireframe', 'Meeting with team', 'Buy a cat food']);

    expect(screen.getByRole('checkbox', { name: 'Buy a cat food' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Meeting with team' })).not.toBeChecked();
    for (const title of taskTitles()) {
      expect(screen.getByRole('button', { name: `Delete ${title}` })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: `Edit ${title}` })).toBeInTheDocument();
    }
  });

  it('shows only the tasks dated on another selected day', async () => {
    setToday('2026-11-05');
    stubTaskApi(WEEK_TASKS);
    renderHome();
    await screen.findByLabelText('Finishing Wireframe');

    await userEvent.click(screen.getByRole('button', { name: 'Sat 7' }));

    expect(screen.getByRole('heading', { name: 'Tasks for Saturday, Nov 7' })).toBeInTheDocument();
    expect(taskTitles()).toEqual(['Review pull requests', 'Doing Homework']);
    expect(screen.getByRole('button', { name: 'Sat 7' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the row actions reachable by keyboard', async () => {
    setToday('2026-11-05');
    stubTaskApi(WEEK_TASKS);
    renderHome();
    await screen.findByLabelText('Finishing Wireframe');

    const checkbox = screen.getByRole('checkbox', { name: 'Finishing Wireframe' });
    checkbox.focus();
    expect(checkbox).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Delete Finishing Wireframe' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Edit Finishing Wireframe' })).toHaveFocus();
  });
});

describe('US-05 See weekly complete, pending, and progress', () => {
  it('counts only Monday–Sunday tasks of the current week', async () => {
    setToday('2026-11-05');
    stubTaskApi(WEEK_TASKS);
    renderHome();

    expect(await screen.findByRole('group', { name: 'Task Complete: 3 this week' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Task Pending: 3 this week' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows zero counts and an empty progress bar for an empty week', async () => {
    setToday('2026-11-05');
    stubTaskApi([]);
    renderHome();

    expect(await screen.findByRole('group', { name: 'Task Complete: 0 this week' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Task Pending: 0 this week' })).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuetext', 'No tasks this week');
  });

  it('does not show made-up counts while loading or after a failed load', async () => {
    setToday('2026-11-05');
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'Database unavailable' }, 500)));
    renderHome();

    expect(screen.getByRole('group', { name: 'Task Complete: not available' })).toBeInTheDocument();
    expect(await screen.findByText(/Could not load tasks: Database unavailable/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Task Complete: not available' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Task Pending: not available' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  it('refreshes the cards and the progress bar when tasks change and the app regains focus', async () => {
    setToday('2026-11-05');
    const { store } = stubTaskApi(WEEK_TASKS);
    renderHome();
    await screen.findByRole('group', { name: 'Task Complete: 3 this week' });

    store.tasks = store.tasks
      .filter((task) => task.title !== 'Grocery run')
      .map((task) => (task.title === 'Meeting with team' ? { ...task, completed: true } : task))
      .concat(
        { id: 'new1', title: 'Plan sprint', date: '2026-11-06', startTime: '09:00', completed: false },
        { id: 'new2', title: 'Call plumber', date: '2026-11-08', startTime: '12:00', completed: false },
      );

    fireEvent(window, new Event('focus'));

    expect(await screen.findByRole('group', { name: 'Task Pending: 4 this week' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Task Complete: 3 this week' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '43');
    expect(screen.getByRole('checkbox', { name: 'Meeting with team' })).toBeChecked();
  });
});
