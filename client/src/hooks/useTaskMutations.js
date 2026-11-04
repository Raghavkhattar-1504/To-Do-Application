import { useCallback, useState } from 'react';
import { createTask, deleteTask, updateTask } from '../api/tasks.js';
import { upsertTask } from '../lib/tasks.js';

function setCompleted(tasks, id, completed) {
  return tasks.map((task) => (task.id === id ? { ...task, completed } : task));
}

// Applies task changes to a local list and the API. `belongs` decides whether a
// saved task still belongs in that list (for example, the visible week).
export function useTaskMutations(setTasks, belongs) {
  const [error, setError] = useState(null);

  const toggle = useCallback(
    async (task) => {
      const completed = !task.completed;
      setError(null);
      setTasks((tasks) => setCompleted(tasks, task.id, completed));
      try {
        const saved = await updateTask(task.id, { completed });
        setTasks((tasks) => tasks.map((existing) => (existing.id === saved.id ? saved : existing)));
      } catch (err) {
        setTasks((tasks) => setCompleted(tasks, task.id, task.completed));
        setError(`Could not update "${task.title}": ${err.message}`);
      }
    },
    [setTasks],
  );

  const remove = useCallback(
    async (task) => {
      setError(null);
      try {
        await deleteTask(task.id);
        setTasks((tasks) => tasks.filter((existing) => existing.id !== task.id));
      } catch (err) {
        setError(`Could not delete "${task.title}": ${err.message}`);
      }
    },
    [setTasks],
  );

  const save = useCallback(
    async (values, existing) => {
      const saved = existing ? await updateTask(existing.id, values) : await createTask(values);
      setTasks((tasks) => upsertTask(tasks, saved, belongs));
      return saved;
    },
    [setTasks, belongs],
  );

  return { toggle, remove, save, error, clearError: () => setError(null) };
}
