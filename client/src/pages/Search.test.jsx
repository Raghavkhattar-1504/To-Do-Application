import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubTaskApi } from '../test/fakeApi.js';
import { dayButton, listedTitles, renderApp, setToday, taskSection } from '../test/renderApp.jsx';

const TASKS = [
  { title: 'Finishing Wireframe', date: '2026-11-05', startTime: '09:00' },
  { title: 'Meeting with team', description: 'FINISH the agenda', date: '2026-11-05', startTime: '11:30' },
  { title: 'Buy a cat food', date: '2026-11-05', startTime: '18:00', completed: true },
  { title: 'Finish taxes', date: '2026-11-20', startTime: '10:00' },
  { title: 'Plan sprint', date: '2026-11-07', startTime: '10:00' },
];

async function openHome() {
  setToday('2026-11-05');
  const api = stubTaskApi(TASKS);
  renderApp('/home');
  await screen.findByLabelText('Finishing Wireframe');
  return api;
}

async function searchFromHome(query) {
  await userEvent.type(screen.getByRole('searchbox', { name: 'Search for a task' }), `${query}{Enter}`);
  await screen.findByRole('button', { name: 'Back' });
}

function results() {
  return screen.queryByRole('list', { name: 'Search results' });
}

describe('US-15 Search by title or description', () => {
  it('shows a search field with the placeholder on home', async () => {
    await openHome();

    expect(screen.getByRole('searchbox', { name: 'Search for a task' })).toHaveAttribute(
      'placeholder',
      'Search for a task',
    );
  });

  it('opens a search screen with a back control, the query, and one row per match', async () => {
    await openHome();

    await searchFromHome('finish');

    expect(screen.getByRole('searchbox', { name: 'Search for a task' })).toHaveValue('finish');
    await waitFor(() => expect(results()).toBeInTheDocument());
    expect(listedTitles(results())).toEqual(['Finishing Wireframe', 'Meeting with team', 'Finish taxes']);
  });

  it('matches title or description regardless of case, across weeks, and excludes the rest', async () => {
    await openHome();
    await searchFromHome('FiNiSh');

    await waitFor(() => expect(results()).toBeInTheDocument());
    const titles = listedTitles(results());
    expect(titles).toContain('Meeting with team');
    expect(titles).toContain('Finish taxes');
    expect(titles).not.toContain('Buy a cat food');
    expect(titles).not.toContain('Plan sprint');
  });

  it('shows the title and completion checkbox on each row', async () => {
    await openHome();
    await searchFromHome('a');

    await waitFor(() => expect(results()).toBeInTheDocument());
    const rows = within(results()).getAllByRole('listitem');
    expect(rows).toHaveLength(5);
    expect(within(results()).getByRole('checkbox', { name: 'Buy a cat food' })).toBeChecked();
    expect(within(results()).getByRole('checkbox', { name: 'Plan sprint' })).not.toBeChecked();
  });

  it('updates the results as the query changes', async () => {
    await openHome();
    await searchFromHome('finish');
    await waitFor(() => expect(results()).toBeInTheDocument());

    const input = screen.getByRole('searchbox', { name: 'Search for a task' });
    await userEvent.clear(input);
    await userEvent.type(input, 'cat');

    await waitFor(() => expect(listedTitles(results())).toEqual(['Buy a cat food']));
  });
});

describe('US-16 Update a task from search results', () => {
  it('toggles status from a result and the home counts agree', async () => {
    const { store } = await openHome();
    expect(screen.getByRole('group', { name: 'Task Complete: 1 this week' })).toBeInTheDocument();
    await searchFromHome('wireframe');
    await waitFor(() => expect(results()).toBeInTheDocument());

    await userEvent.click(within(results()).getByRole('checkbox', { name: 'Finishing Wireframe' }));

    expect(within(results()).getByRole('checkbox', { name: 'Finishing Wireframe' })).toBeChecked();
    await waitFor(() => expect(store.find('Finishing Wireframe').completed).toBe(true));

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('group', { name: 'Task Complete: 2 this week' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Finishing Wireframe' })).toBeChecked();
  });

  it('edits a result and shows the saved values', async () => {
    const { store } = await openHome();
    await searchFromHome('taxes');
    await waitFor(() => expect(results()).toBeInTheDocument());

    await userEvent.click(within(results()).getByRole('button', { name: 'Edit Finish taxes' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Task' });
    expect(within(dialog).getByLabelText('Set Date')).toHaveValue('2026-11-20');
    const title = within(dialog).getByLabelText('Task title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Finish taxes and file');
    fireEvent.change(within(dialog).getByLabelText('Start'), { target: { value: '14:00' } });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(listedTitles(results())).toEqual(['Finish taxes and file']);
    expect(store.find('Finish taxes and file')).toMatchObject({ startTime: '14:00', date: '2026-11-20' });
    expect(store.tasks).toHaveLength(5);
  });

  it('removes a result after it is edited so it no longer matches', async () => {
    await openHome();
    await searchFromHome('taxes');
    await waitFor(() => expect(results()).toBeInTheDocument());

    await userEvent.click(within(results()).getByRole('button', { name: 'Edit Finish taxes' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Task' });
    const title = within(dialog).getByLabelText('Task title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Pay accountant');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('No tasks match "taxes".')).toBeInTheDocument();
  });

  it('deletes a result and removes it from the list', async () => {
    const { store } = await openHome();
    await searchFromHome('finish');
    await waitFor(() => expect(results()).toBeInTheDocument());

    await userEvent.click(within(results()).getByRole('button', { name: 'Delete Finish taxes' }));

    await waitFor(() => expect(listedTitles(results())).toEqual(['Finishing Wireframe', 'Meeting with team']));
    expect(store.find('Finish taxes')).toBeUndefined();
  });
});

describe('US-17 Leave search when nothing matches or I am done', () => {
  it('shows a no-matches state with no rows', async () => {
    await openHome();
    await searchFromHome('zebra');

    expect(await screen.findByText('No tasks match "zebra".')).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('goes back to home with the same selected day', async () => {
    await openHome();
    await userEvent.click(dayButton('Sat 7'));
    await searchFromHome('plan');

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByRole('heading', { name: 'Tasks for Saturday, Nov 7' })).toBeInTheDocument();
    expect(dayButton('Sat 7')).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(listedTitles(taskSection())).toEqual(['Plan sprint']));
  });

  it('goes to home when search was opened directly', async () => {
    setToday('2026-11-05');
    stubTaskApi(TASKS);
    renderApp('/search?q=plan');
    expect(screen.getByRole('searchbox', { name: 'Search for a task' })).toHaveValue('plan');

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByRole('heading', { name: 'Tasks Today' })).toBeInTheDocument();
  });

  it('stops showing filtered results once the query is cleared', async () => {
    await openHome();
    await searchFromHome('finish');
    await waitFor(() => expect(results()).toBeInTheDocument());

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Search for a task' }));

    expect(results()).not.toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByText('Type a word from a task title or description.')).toBeInTheDocument();
  });
});
