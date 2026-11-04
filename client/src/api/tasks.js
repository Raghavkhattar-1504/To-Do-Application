const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(body?.error || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.fields = body?.fields;
    throw error;
  }
  return body;
}

export function listTasksInRange({ from, to }, { signal } = {}) {
  const params = new URLSearchParams({ from, to });
  return request(`/tasks?${params}`, { signal });
}

export function searchTasks(query, { signal } = {}) {
  const params = new URLSearchParams({ q: query });
  return request(`/tasks?${params}`, { signal });
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
