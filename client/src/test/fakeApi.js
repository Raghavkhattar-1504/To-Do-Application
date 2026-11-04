import { vi } from 'vitest';

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const DEFAULTS = { description: '', endTime: null, priority: null, completed: false };
const REQUIRED = { title: 'Title is required', date: 'Date is required', startTime: 'Start time is required' };

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

function missingFields(task) {
  const fields = {};
  for (const [field, message] of Object.entries(REQUIRED)) {
    if (!task[field] || !String(task[field]).trim()) fields[field] = message;
  }
  return fields;
}

// In-memory stand-in for the Express task API, installed as global fetch.
export function stubTaskApi(initialTasks = []) {
  let nextId = initialTasks.length + 1;
  const store = {
    tasks: initialTasks.map((task, index) => ({ id: `t${index + 1}`, ...DEFAULTS, ...task })),
    find: (title) => store.tasks.find((task) => task.title === title),
  };

  const fetchMock = vi.fn(async (input, options = {}) => {
    const url = new URL(String(input), 'http://localhost');
    const method = (options.method ?? 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};
    const idMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);

    if (method === 'GET' && url.pathname === '/api/tasks') {
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      const q = url.searchParams.get('q')?.toLowerCase();
      const matches = store.tasks.filter(
        (task) =>
          (!from || task.date >= from) &&
          (!to || task.date <= to) &&
          (!q || task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q)),
      );
      return jsonResponse(sortTasks(matches));
    }

    if (method === 'POST' && url.pathname === '/api/tasks') {
      const task = { id: `t${nextId++}`, ...DEFAULTS, ...body };
      const fields = missingFields(task);
      if (Object.keys(fields).length) return jsonResponse({ error: 'Validation failed', fields }, 400);
      store.tasks.push(task);
      return jsonResponse(task, 201);
    }

    if (idMatch) {
      const index = store.tasks.findIndex((task) => task.id === idMatch[1]);
      if (index === -1) return jsonResponse({ error: 'Task not found' }, 404);

      if (method === 'PATCH') {
        const updated = { ...store.tasks[index], ...body };
        const fields = missingFields(updated);
        if (Object.keys(fields).length) return jsonResponse({ error: 'Validation failed', fields }, 400);
        store.tasks[index] = updated;
        return jsonResponse(updated);
      }
      if (method === 'DELETE') {
        store.tasks.splice(index, 1);
        return new Response(null, { status: 204 });
      }
    }

    return jsonResponse({ error: 'Not found' }, 404);
  });

  vi.stubGlobal('fetch', fetchMock);

  const callsTo = (method, pathPrefix = '/api/tasks') =>
    fetchMock.mock.calls.filter(([input, options = {}]) => {
      const url = new URL(String(input), 'http://localhost');
      return (options.method ?? 'GET').toUpperCase() === method && url.pathname.startsWith(pathPrefix);
    });

  return { store, fetchMock, callsTo };
}
