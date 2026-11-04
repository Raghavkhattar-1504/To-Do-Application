import TaskList from './TaskList.jsx';
import { groupByDate } from '../lib/tasks.js';
import { fromISODate } from '../lib/week.js';

function dayHeading(iso) {
  return fromISODate(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function WeekTaskList({ days, tasks, onToggle, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-muted">No tasks this week.</p>;
  }

  const groups = groupByDate(tasks);

  return (
    <div className="flex flex-col gap-4">
      {days
        .filter((day) => groups.has(day.iso))
        .map((day) => (
          <section key={day.iso} aria-labelledby={`week-${day.iso}`}>
            <h3 id={`week-${day.iso}`} className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {dayHeading(day.iso)}
            </h3>
            <TaskList
              label={dayHeading(day.iso)}
              tasks={groups.get(day.iso)}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </section>
        ))}
    </div>
  );
}
