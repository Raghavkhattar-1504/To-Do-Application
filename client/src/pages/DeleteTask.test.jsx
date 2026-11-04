import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jsonResponse, stubTaskApi } from '../test/fakeApi.js';
import { listedTitles, renderApp, setToday, taskSection } from '../test/renderApp.jsx';

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
  await screen.findByLabelText('Finishing Wireframe');
  return api;
}

describe('US-14 Remove a task', () => {
  it('deletes the task through the API and leaves the other rows', async () => {
    const { store, callsTo } = await openHome();
    const id = store.find('Meeting with team').id;

    await userEvent.click(screen.getByRole('button', { name: 'Delete Meeting with team' }));

    await waitFor(() => expect(listedTitles(taskSection())).toEqual(['Finishing Wireframe', 'Buy a cat food']));
    expect(callsTo('DELETE', `/api/tasks/${id}`)).toHaveLength(1);
    expect(store.find('Meeting with team')).toBeUndefined();
  });

  it('drops a pending task from the pending count and recalculates progress', async () => {
    await openHome();
    expect(screen.getByRole('group', { name: 'Task Pending: 3 this week' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete Finishing Wireframe' }));

    expect(await screen.findByRole('group', { name: 'Task Pending: 2 this week' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Task Complete: 1 this week' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
  });

  it('drops a completed task from the complete count', async () => {
    await openHome();

    await userEvent.click(screen.getByRole('button', { name: 'Delete Buy a cat food' }));

    expect(await screen.findByRole('group', { name: 'Task Complete: 0 this week' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('no longer finds the deleted task in search', async () => {
    await openHome();
    await userEvent.click(screen.getByRole('button', { name: 'View All' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete Plan sprint' }));
    await waitFor(() => expect(screen.queryByLabelText('Plan sprint')).not.toBeInTheDocument());

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search for a task' }), 'plan{Enter}');

    expect(await screen.findByText('No tasks match "plan".')).toBeInTheDocument();
  });

  it('keeps the row and explains when the delete fails', async () => {
    await openHome();
    const realFetch = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input, options = {}) =>
        options.method === 'DELETE' ? jsonResponse({ error: 'Database unavailable' }, 500) : realFetch(input, options),
      ),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete Finishing Wireframe' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete "Finishing Wireframe"');
    expect(screen.getByLabelText('Finishing Wireframe')).toBeInTheDocument();
  });
});
