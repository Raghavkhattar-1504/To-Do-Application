import { useEffect, useId, useRef, useState } from 'react';
import { CloseIcon } from './icons.jsx';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const REQUIRED_MESSAGES = {
  title: 'Enter a task title',
  startTime: 'Choose a start time',
  date: 'Choose a date',
};

function initialValues(task, defaultDate) {
  return {
    title: task?.title ?? '',
    startTime: task?.startTime ?? '',
    endTime: task?.endTime ?? '',
    date: task?.date ?? defaultDate ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? null,
  };
}

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = REQUIRED_MESSAGES.title;
  if (!values.startTime) errors.startTime = REQUIRED_MESSAGES.startTime;
  if (!values.date) errors.date = REQUIRED_MESSAGES.date;
  return errors;
}

const inputClass =
  'w-full rounded border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none';

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-pending-icon">
      {message}
    </p>
  );
}

export default function TaskSheet({ task, defaultDate, onSave, onClose }) {
  const editing = Boolean(task);
  const ids = useId();
  const [values, setValues] = useState(() => initialValues(task, defaultDate));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    titleRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  const field = (name) => ({
    id: `${ids}-${name}`,
    value: values[name],
    onChange: (event) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${ids}-${name}-error` : undefined,
    className: `${inputClass} ${errors[name] ? 'border-pending-icon' : 'border-slate-200'}`,
  });

  const submit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        title: values.title.trim(),
        description: values.description.trim(),
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime || null,
        priority: values.priority,
      });
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      setSubmitError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${ids}-heading`}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white px-5 pb-6 pt-5 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id={`${ids}-heading`} className="text-base font-semibold text-ink">
            {editing ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-ink hover:text-brand">
            <CloseIcon />
          </button>
        </div>

        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label htmlFor={`${ids}-title`} className="mb-1.5 block text-xs text-ink-muted">
              Task title
            </label>
            <input ref={titleRef} type="text" placeholder="Task title" {...field('title')} />
            <FieldError id={`${ids}-title-error`} message={errors.title} />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs text-ink-muted">Set Time</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${ids}-startTime`} className="mb-1 block text-[11px] text-ink">
                  Start
                </label>
                <input type="time" {...field('startTime')} />
                <FieldError id={`${ids}-startTime-error`} message={errors.startTime} />
              </div>
              <div>
                <label htmlFor={`${ids}-endTime`} className="mb-1 block text-[11px] text-ink">
                  Ends
                </label>
                <input type="time" {...field('endTime')} />
                <FieldError id={`${ids}-endTime-error`} message={errors.endTime} />
              </div>
            </div>
          </fieldset>

          <div>
            <label htmlFor={`${ids}-date`} className="mb-1.5 block text-xs text-ink-muted">
              Set Date
            </label>
            <input type="date" {...field('date')} />
            <FieldError id={`${ids}-date-error`} message={errors.date} />
          </div>

          <div>
            <label htmlFor={`${ids}-description`} className="mb-1.5 block text-xs text-ink-muted">
              Description
            </label>
            <textarea rows={3} placeholder="Add Description" {...field('description')} />
          </div>

          <div role="group" aria-labelledby={`${ids}-priority`}>
            <p id={`${ids}-priority`} className="mb-1.5 text-xs text-ink-muted">
              Priority
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((option) => {
                const selected = values.priority === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setValues((prev) => ({ ...prev, priority: selected ? null : option.value }))}
                    className={`rounded border py-2 text-xs transition ${
                      selected ? 'border-brand bg-brand text-white' : 'border-slate-200 text-ink hover:border-brand'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {submitError && (
            <p role="alert" className="text-sm text-pending-icon">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full rounded bg-brand py-3.5 text-sm font-medium text-white transition hover:bg-brand-strong disabled:opacity-60"
          >
            {editing ? 'Save changes' : 'Create task'}
          </button>
        </form>
      </div>
    </div>
  );
}
