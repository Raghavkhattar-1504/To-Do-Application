import { useEffect, useState } from 'react';
import { fromISODate, toISODate } from '../lib/week.js';

function msUntilNextMidnight(iso) {
  const start = fromISODate(iso);
  const next = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return Math.max(next.getTime() - Date.now(), 0);
}

// Returns today's date as YYYY-MM-DD. The value only changes when the calendar
// date changes, so focus events on the same day never trigger a re-render.
export function useToday() {
  const [todayIso, setTodayIso] = useState(() => toISODate(new Date()));

  useEffect(() => {
    const sync = () => setTodayIso(toISODate(new Date()));

    const timer = setTimeout(sync, msUntilNextMidnight(todayIso) + 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [todayIso]);

  return todayIso;
}
