import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jsonResponse, stubTaskApi } from '../test/fakeApi.js';
import { renderApp, setToday } from '../test/renderApp.jsx';

const TASKS = [
  { title: 'Finishing Wireframe', date: '2026-11-05', startTime: '09:00' },
  { title: 'Meeting with team', date: '2026-11-05', startTime: '11:30' },
  { title: 'Buy a cat food', date: '2026-11-05', startTime: '18:00', completed: true },
  { title: 'Plan sprint', date: '2026-11-07', startTime: '10:00' },
];

async function openHome() {
  setToday('2026-11-05');
  const api = stubTaskApi(TASKS);
  renderApp('/home');
  await screen.findByRole('group', { name: 'Task Complete: 1 this week' });
  return api;
}

describe('US-08 Mark a task complete or not complete', () => {
  it('completes an open task, strikes it through, and saves it', async () => {
    const { store, callsTo } = await openHome();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Finishing Wireframe' }));

    const checkbox = screen.getByRole('checkbox', { name: 'Finishing Wireframe' });
    expect(checkbox).toBeChecked();
    expect(checkbox.labels[0]).toHaveClass('line-through');
    await waitFor(() => expect(store.find('Finishing Wireframe').completed).toBe(true));
    expect(JSON.parse(callsTo('PATCH')[0][1].body)).toEqual({ completed: true });
  });

  it('reopens a completed task and removes the strike-through', async () => {
    const { store } = await openHome();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Buy a cat food' }));

    const checkbox = screen.getByRole('checkbox', { name: 'Buy a cat food' });
    expect(checkbox).not.toBeChecked();
    expect(checkbox.labels[0]).not.toHaveClass('line-through');
    await waitFor(() => expect(store.find('Buy a cat food').completed).toBe(false));
  });

  it('updates the cards and the progress bar immediately', async () => {
    await openHome();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Meeting with team' }));

    expect(screen.getByRole('group', { name: 'Task Complete: 2 this week' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Task Pending: 2 this week' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('changes only the task that was clicked', async () => {
    await openHome();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Meeting with team' }));

    expect(screen.getByRole('checkbox', { name: 'Meeting with team' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Finishing Wireframe' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Buy a cat food' })).toBeChecked();
  });

  it('puts the checkbox and counts back and explains when saving fails', async () => {
    await openHome();
    const realFetch = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input, options = {}) =>
        options.method === 'PATCH' ? jsonResponse({ error: 'Database unavailable' }, 500) : realFetch(input, options),
      ),
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Finishing Wireframe' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not update "Finishing Wireframe": Database unavailable',
    );
    expect(screen.getByRole('checkbox', { name: 'Finishing Wireframe' })).not.toBeChecked();
    expect(screen.getByRole('group', { name: 'Task Complete: 1 this week' })).toBeInTheDocument();
  });
});
