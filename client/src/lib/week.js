const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isSameDay(a, b) {
  return toISODate(a) === toISODate(b);
}

export function startOfWeek(date) {
  const monday = startOfDay(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

export function weekDays(date) {
  const monday = startOfWeek(date);
  return WEEKDAY_LABELS.map((weekday, index) => {
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    return { iso: toISODate(day), weekday, dayOfMonth: day.getDate() };
  });
}

export function weekRange(date) {
  const days = weekDays(date);
  return { from: days[0].iso, to: days[6].iso };
}

export function summarize(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, pending: total - completed, total, percent };
}
