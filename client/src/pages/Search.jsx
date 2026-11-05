import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import TaskList from '../components/TaskList.jsx';
import TaskSheet from '../components/TaskSheet.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { BackIcon, SearchIcon } from '../components/icons.jsx';
import { searchTasks } from '../api/tasks.js';
import { useTaskMutations } from '../hooks/useTaskMutations.js';
import { matchesQuery } from '../lib/tasks.js';
import { fromISODate } from '../lib/week.js';

const DEBOUNCE_MS = 250;

function taskMeta(task) {
  const day = fromISODate(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${day} · ${task.startTime}`;
}

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const trimmed = query.trim();

  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [searchedFor, setSearchedFor] = useState('');
  const setParamsRef = useRef(setParams);
  setParamsRef.current = setParams;

  useEffect(() => {
    if (!trimmed) {
      setResults([]);
      setStatus('idle');
      setSearchedFor('');
      setParamsRef.current({}, { replace: true });
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setParamsRef.current({ q: trimmed }, { replace: true });
      setStatus((prev) => (prev === 'ready' ? prev : 'loading'));
      searchTasks(trimmed, { signal: controller.signal })
        .then((data) => {
          if (!Array.isArray(data)) throw new Error('The API did not return a task list.');
          setResults(data);
          setSearchedFor(trimmed);
          setError(null);
          setStatus('ready');
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          setError(err);
          setStatus('error');
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const stillMatches = useCallback((task) => matchesQuery(task, searchedFor), [searchedFor]);
  const { toggle, remove, save, error: actionError, clearError } = useTaskMutations(setResults, stillMatches);

  const [editing, setEditing] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/home', { replace: true });
  };

  return (
    <main className="flex flex-1 flex-col gap-5 bg-white px-5 pb-10 pt-5">
      <button type="button" onClick={goBack} aria-label="Back" className="self-start p-1 text-ink hover:text-brand">
        <BackIcon />
      </button>

      <div role="search" className="flex items-center gap-3 rounded border border-slate-200 px-4 py-3">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a task"
          aria-label="Search for a task"
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <SearchIcon className="h-5 w-5 text-ink" />
      </div>

      <ErrorBanner message={actionError} onDismiss={clearError} />

      {!trimmed && <p className="py-6 text-center text-sm text-ink-muted">Type a word from a task title or description.</p>}

      {trimmed && status === 'loading' && <p className="py-6 text-center text-sm text-ink-muted">Searching…</p>}

      {trimmed && status === 'error' && (
        <p role="alert" className="py-6 text-center text-sm text-pending-icon">
          Search failed: {error?.message}
        </p>
      )}

      {trimmed && status === 'ready' && (
        <TaskList
          label="Search results"
          tasks={results}
          metaFor={taskMeta}
          emptyMessage={`No tasks match "${searchedFor}".`}
          onToggle={toggle}
          onEdit={(task) => setEditing(task)}
          onDelete={remove}
        />
      )}

      {editing && (
        <TaskSheet
          key={editing.id}
          task={editing}
          onSave={async (values) => {
            await save(values, editing);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}
