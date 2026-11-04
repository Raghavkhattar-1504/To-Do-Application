import TaskRow from './TaskRow.jsx';

export default function TaskList({ tasks, emptyMessage, metaFor, label, onToggle, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-muted">{emptyMessage}</p>;
  }

  return (
    <ul aria-label={label}>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          meta={metaFor?.(task)}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
