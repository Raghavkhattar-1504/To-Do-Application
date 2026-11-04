export function compareTasks(a, b) {
  return (
    a.date.localeCompare(b.date) ||
    a.startTime.localeCompare(b.startTime) ||
    (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
  );
}

export function upsertTask(tasks, task, belongs = () => true) {
  const others = tasks.filter((existing) => existing.id !== task.id);
  return belongs(task) ? [...others, task].sort(compareTasks) : others;
}

export function matchesQuery(task, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;
  return task.title.toLowerCase().includes(needle) || (task.description ?? '').toLowerCase().includes(needle);
}

export function groupByDate(tasks) {
  const groups = new Map();
  for (const task of tasks) {
    if (!groups.has(task.date)) groups.set(task.date, []);
    groups.get(task.date).push(task);
  }
  return groups;
}
