import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar.jsx';
import DayStrip from '../components/DayStrip.jsx';
import SummaryCards from '../components/SummaryCards.jsx';
import WeeklyProgress from '../components/WeeklyProgress.jsx';
import TaskList from '../components/TaskList.jsx';
import WeekTaskList from '../components/WeekTaskList.jsx';
import TaskSheet from '../components/TaskSheet.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { useToday } from '../hooks/useToday.js';
import { useWeekTasks } from '../hooks/useWeekTasks.js';
import { useTaskMutations } from '../hooks/useTaskMutations.js';
import { fromISODate, summarize, weekDays, weekRange } from '../lib/week.js';

function dayTitle(selectedIso, todayIso) {
  if (selectedIso === todayIso) return 'Tasks Today';
  const label = fromISODate(selectedIso).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  return `Tasks for ${label}`;
}

export default function Home() {
  const navigate = useNavigate();
  const todayIso = useToday();
  const days = useMemo(() => weekDays(fromISODate(todayIso)), [todayIso]);
  const { from, to } = useMemo(() => weekRange(fromISODate(todayIso)), [todayIso]);

  const [params, setParams] = useSearchParams();
  const requestedDay = params.get('day');
  const selectedIso = requestedDay && requestedDay >= from && requestedDay <= to ? requestedDay : todayIso;
  const showWeek = params.get('view') === 'week';

  const updateParams = useCallback(
    (changes) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value == null) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const lastTodayIso = useRef(todayIso);
  useEffect(() => {
    if (lastTodayIso.current === todayIso) return;
    lastTodayIso.current = todayIso;
    updateParams({ day: null });
  }, [todayIso, updateParams]);

  const selectDay = (iso) => updateParams({ day: iso === todayIso ? null : iso });

  const { tasks, setTasks, status, error, reload } = useWeekTasks({ from, to });
  const inWeek = useCallback((task) => task.date >= from && task.date <= to, [from, to]);
  const { toggle, remove, save, error: actionError, clearError } = useTaskMutations(setTasks, inWeek);
  const ready = status === 'ready';

  const dayTasks = useMemo(() => tasks.filter((task) => task.date === selectedIso), [tasks, selectedIso]);
  const summary = useMemo(() => summarize(tasks), [tasks]);

  const [sheet, setSheet] = useState(null);
  const sheetKey = useRef(0);
  const openSheet = (task = null) => {
    sheetKey.current += 1;
    setSheet({ task, key: sheetKey.current });
  };
  const closeSheet = () => setSheet(null);
  const saveSheet = async (values) => {
    await save(values, sheet.task);
    closeSheet();
  };

  const rowHandlers = { onToggle: toggle, onEdit: (task) => openSheet(task), onDelete: remove };

  return (
    <main className="relative flex flex-1 flex-col gap-6 bg-slate-50 px-5 pb-28 pt-6">
      <SearchBar onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)} />

      <DayStrip days={days} selectedIso={selectedIso} todayIso={todayIso} onSelect={selectDay} />

      <SummaryCards
        completed={ready ? summary.completed : undefined}
        pending={ready ? summary.pending : undefined}
      />

      <WeeklyProgress percent={ready ? summary.percent : undefined} total={summary.total} />

      <ErrorBanner message={actionError} onDismiss={clearError} />

      <section aria-labelledby="task-list-heading">
        <div className="flex items-center justify-between">
          <h2 id="task-list-heading" className="text-base font-semibold text-ink">
            {showWeek ? 'Tasks This Week' : dayTitle(selectedIso, todayIso)}
          </h2>
          <button
            type="button"
            onClick={() => updateParams({ view: showWeek ? null : 'week' })}
            className="text-xs font-medium text-brand hover:underline"
          >
            {showWeek ? 'Show Day' : 'View All'}
          </button>
        </div>

        {status === 'loading' && <p className="py-6 text-sm text-ink-muted">Loading tasks…</p>}

        {status === 'error' && (
          <div className="py-6 text-sm text-pending-icon">
            <p>Could not load tasks: {error?.message}</p>
            <button type="button" onClick={reload} className="mt-2 font-medium text-brand hover:underline">
              Try again
            </button>
          </div>
        )}

        {ready && showWeek && <WeekTaskList days={days} tasks={tasks} {...rowHandlers} />}

        {ready && !showWeek && (
          <TaskList
            label={dayTitle(selectedIso, todayIso)}
            tasks={dayTasks}
            emptyMessage="No tasks for this day."
            {...rowHandlers}
          />
        )}
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex justify-center">
        <button
          type="button"
          aria-label="Add task"
          onClick={() => openSheet()}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 transition hover:bg-brand-strong focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
        >
          <PlusIcon />
        </button>
      </div>

      {sheet && (
        <TaskSheet
          key={sheet.key}
          task={sheet.task}
          defaultDate={selectedIso}
          onSave={saveSheet}
          onClose={closeSheet}
        />
      )}
    </main>
  );
}
