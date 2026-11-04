import { useCallback, useEffect, useRef, useState } from 'react';
import { listTasksInRange } from '../api/tasks.js';

export function useWeekTasks({ from, to }) {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    const controller = new AbortController();

    const load = ({ silent }) => {
      if (!silent) {
        setStatus('loading');
        setError(null);
      }
      listTasksInRange({ from, to }, { signal: controller.signal })
        .then((data) => {
          setTasks(data);
          setStatus('ready');
          setError(null);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          if (silent && statusRef.current === 'ready') return;
          setError(err);
          setStatus('error');
        });
    };

    load({ silent: false });

    const refresh = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      controller.abort();
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [from, to, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { tasks, setTasks, status, error, reload };
}
