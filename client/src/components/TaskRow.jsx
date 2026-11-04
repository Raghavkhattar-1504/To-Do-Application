import { PencilIcon, TrashIcon } from './icons.jsx';

export default function TaskRow({ task, meta, onToggle, onEdit, onDelete }) {
  const checkboxId = `task-${task.id}`;

  return (
    <li className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-b-0">
      <input
        id={checkboxId}
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
        className="h-5 w-5 shrink-0 cursor-pointer rounded-sm border-ink-faint accent-brand"
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={checkboxId}
          className={`block cursor-pointer truncate text-sm ${task.completed ? 'text-ink-muted line-through' : 'text-ink'}`}
        >
          {task.title}
        </label>
        {meta && <p className="truncate text-[11px] text-ink-muted">{meta}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDelete(task)}
        aria-label={`Delete ${task.title}`}
        className="p-1 text-ink-faint hover:text-pending-icon"
      >
        <TrashIcon />
      </button>
      <button
        type="button"
        onClick={() => onEdit(task)}
        aria-label={`Edit ${task.title}`}
        className="p-1 text-ink-faint hover:text-brand"
      >
        <PencilIcon />
      </button>
    </li>
  );
}
