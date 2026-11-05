const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;

  const body = await res.json().catch(() => undefined);
  if (!res.ok) {
    const error = new Error(body?.error || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.fields = body?.fields;
    throw error;
  }
  // A 2xx that is not JSON is almost always the host's SPA fallback answering
  // in place of the API (for example Netlify serving index.html for /api/*
  // when VITE_API_URL is not set).
  if (body === undefined) {
    const error = new Error('The API returned an unexpected response. Check that VITE_API_URL points at the API.');
    error.status = res.status;
    throw error;
  }
  return body;
}

async function requestTaskList(query, signal) {
  const body = await request(`/tasks?${query}`, { signal });
  if (!Array.isArray(body)) {
    throw new Error('The API returned an unexpected response. Check that VITE_API_URL points at the API.');
  }
  return body;
}

export function listTasksInRange({ from, to }, { signal } = {}) {
  return requestTaskList(new URLSearchParams({ from, to }), signal);
}

export function searchTasks(query, { signal } = {}) {
  return requestTaskList(new URLSearchParams({ q: query }), signal);
}

export function createTask(values) {
  return request('/tasks', { method: 'POST', body: JSON.stringify(values) });
}

export function updateTask(id, changes) {
  return request(`/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) });
}

export function deleteTask(id) {
  return request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
