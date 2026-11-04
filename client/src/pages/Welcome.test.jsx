import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { stubTaskApi } from '../test/fakeApi.js';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>,
  );
}

describe('US-01 Land on the welcome screen', () => {
  it('shows the heading, the supporting line, and Get Started', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { level: 1, name: 'Manage What To Do' })).toBeInTheDocument();
    expect(
      screen.getByText("The best way to manage what you have to do, don't forget your plans"),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
  });
});

describe('US-02 Enter home from welcome', () => {
  it('opens home and hides the welcome screen after Get Started', async () => {
    stubTaskApi([]);
    renderAt('/');

    await userEvent.click(screen.getByRole('button', { name: 'Get Started' }));

    expect(await screen.findByRole('heading', { name: 'Weekly Progress' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Manage What To Do' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Get Started' })).not.toBeInTheDocument();
  });
});
