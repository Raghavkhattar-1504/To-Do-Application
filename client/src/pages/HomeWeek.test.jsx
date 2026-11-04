import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubTaskApi } from '../test/fakeApi.js';
import { dayButton, listedTitles, renderApp, setToday, taskSection } from '../test/renderApp.jsx';

const WEEK_TASKS = [
  { title: 'Grocery run', date: '2026-11-02', startTime: '08:30', completed: true },
  { title: 'Finishing Wireframe', date: '2026-11-05', startTime: '09:00' },
  { title: 'Buy a cat food', date: '2026-11-05', startTime: '18:00', completed: true },
  { title: 'Review pull requests', date: '2026-11-07', startTime: '10:00' },
  { title: 'Last week task', date: '2026-11-01', startTime: '08:00' },
  { title: 'Next week task', date: '2026-11-09', startTime: '08:00' },
];

describe('Selected day and window focus', () => {
  it('keeps the selected day when the window regains focus on the same date', async () => {
    setToday('2026-11-05');
    const { callsTo } = stubTaskApi(WEEK_TASKS);
    renderApp('/home');
    await screen.findByLabelText('Finishing Wireframe');

    await userEvent.click(dayButton('Sat 7'));
    expect(listedTitles(taskSection())).toEqual(['Review pull requests']);

    vi.setSystemTime(new Date('2026-11-05T22:00:00'));
    const fetchesBefore = callsTo('GET').length;
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await waitFor(() => expect(callsTo('GET').length).toBeGreaterThan(fetchesBefore));

    expect(dayButton('Sat 7')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Tasks for Saturday, Nov 7' })).toBeInTheDocument();
    expect(listedTitles(taskSection())).toEqual(['Review pull requests']);
  });

  it('moves the selection to the new today only after the date rolls over', async () => {
    setToday('2026-11-05', '23:50');
    stubTaskApi(WEEK_TASKS);
    renderApp('/home');
    await screen.findByLabelText('Finishing Wireframe');
    await userEvent.click(dayButton('Mon 2'));

    vi.setSystemTime(new Date('2026-11-06T00:10:00'));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => expect(dayButton('Fri 6, today')).toHaveAttribute('aria-pressed', 'true'));
    expect(dayButton('Mon 2')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: 'Tasks Today' })).toBeInTheDocument();
  });
});

describe('US-06 View every task in the week', () => {
  it('shows a View All action on home', async () => {
    setToday('2026-11-05');
    stubTaskApi(WEEK_TASKS);
    renderApp('/home');

    expect(screen.getByRole('button', { name: 'View All' })).toBeInTheDocument();
  });

  it('lists every Monday–Sunday task grouped by day, and nothing outside the week', async () => {
    setToday('2026-11-05');
    stubTaskApi(WEEK_TASKS);
    renderApp('/home');
    await screen.findByLabelText('Finishing Wireframe');

    await userEvent.click(screen.getByRole('button', { name: 'View All' }));

    const section = taskSection();
    expect(within(section).getByRole('heading', { name: 'Tasks This Week' })).toBeInTheDocument();
    expect(listedTitles(section)).toEqual([
      'Grocery run',
      'Finishing Wireframe',
      'Buy a cat food',
      'Review pull requests',
    ]);
    expect(within(section).getByRole('heading', { name: 'Monday, Nov 2' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Thursday, Nov 5' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Saturday, Nov 7' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Last week task')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next week task')).not.toBeInTheDocument();
  });

  it('lets me check, edit, and delete tasks from the week list', async () => {
    setToday('2026-11-05');
    const { store } = stubTaskApi(WEEK_TASKS);
    renderApp('/home');
    await screen.findByLabelText('Finishing Wireframe');
    await userEvent.click(screen.getByRole('button', { name: 'View All' }));

    await userEvent.click(screen.getByRole('checkbox', { name: 'Review pull requests' }));
    await waitFor(() => expect(store.find('Review pull requests').completed).toBe(true));

    await userEvent.click(screen.getByRole('button', { name: 'Edit Grocery run' }));
    expect(screen.getByRole('dialog', { name: 'Edit Task' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await userEvent.click(screen.getByRole('button', { name: 'Delete Grocery run' }));
    await waitFor(() => expect(screen.queryByLabelText('Grocery run')).not.toBeInTheDocument());
    expect(store.find('Grocery run')).toBeUndefined();
  });

  it('returns to the same selected day after leaving the week list', async () => {
    setToday('2026-11-05');
    stubTaskApi(WEEK_TASKS);
    renderApp('/home');
    await screen.findByLabelText('Finishing Wireframe');
    await userEvent.click(dayButton('Sat 7'));

    await userEvent.click(screen.getByRole('button', { name: 'View All' }));
    await userEvent.click(screen.getByRole('button', { name: 'Show Day' }));

    expect(dayButton('Sat 7')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Tasks for Saturday, Nov 7' })).toBeInTheDocument();
    expect(listedTitles(taskSection())).toEqual(['Review pull requests']);
  });
});

describe('US-07 See an empty day or an empty week', () => {
  it('shows an empty state for a day without tasks and keeps the + button', async () => {
    setToday('2026-11-05');
    stubTaskApi(WEEK_TASKS);
    renderApp('/home');
    await screen.findByLabelText('Finishing Wireframe');

    await userEvent.click(dayButton('Tue 3'));

    expect(screen.getByText('No tasks for this day.')).toBeInTheDocument();
    expect(listedTitles(taskSection())).toEqual([]);
    expect(screen.getByRole('button', { name: 'Add task' })).toBeInTheDocument();
  });

  it('shows zero counts and an empty progress bar for an empty week', async () => {
    setToday('2026-11-05');
    stubTaskApi([]);
    renderApp('/home');

    expect(await screen.findByRole('group', { name: 'Task Complete: 0 this week' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Task Pending: 0 this week' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'No tasks this week');
  });

  it('shows an empty week state, not an error, from View All', async () => {
    setToday('2026-11-05');
    stubTaskApi([]);
    renderApp('/home');
    await screen.findByText('No tasks for this day.');

    await userEvent.click(screen.getByRole('button', { name: 'View All' }));

    expect(screen.getByText('No tasks this week.')).toBeInTheDocument();
    expect(screen.queryByText(/Could not load tasks/)).not.toBeInTheDocument();
  });
});
