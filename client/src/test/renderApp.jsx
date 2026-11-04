import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App.jsx';

export const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true };

export function setToday(iso, time = '10:00') {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${iso}T${time}:00`));
}

export function renderApp(path = '/home') {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE}>
      <App />
    </MemoryRouter>,
  );
}

export function listedTitles(container = document.body) {
  return within(container)
    .queryAllByRole('checkbox')
    .map((checkbox) => checkbox.labels[0].textContent);
}

export function taskSection() {
  return screen.getByRole('region', { name: /^Tasks/ });
}

export function dayButton(name) {
  return within(screen.getByRole('group', { name: 'Days of this week' })).getByRole('button', { name });
}
