import { describe, expect, it } from 'vitest';
import { groupByDate, matchesQuery, upsertTask } from './tasks.js';

const a = { id: 'a', title: 'Alpha', date: '2026-11-05', startTime: '09:00' };
const b = { id: 'b', title: 'Beta', description: 'Weekly sync', date: '2026-11-03', startTime: '10:00' };
const c = { id: 'c', title: 'Gamma', date: '2026-11-05', startTime: '08:00' };

describe('upsertTask', () => {
  it('adds a new task in date and start-time order', () => {
    expect(upsertTask([a, b], c).map((task) => task.id)).toEqual(['b', 'c', 'a']);
  });

  it('replaces an existing task instead of duplicating it', () => {
    const moved = { ...a, date: '2026-11-02' };
    expect(upsertTask([a, b], moved)).toEqual([moved, b]);
  });

  it('removes the task when it no longer belongs to the list', () => {
    const outside = { ...a, date: '2026-11-12' };
    const inWeek = (task) => task.date <= '2026-11-08';
    expect(upsertTask([a, b], outside, inWeek)).toEqual([b]);
  });
});

describe('matchesQuery', () => {
  it('matches title or description without regard to case', () => {
    expect(matchesQuery(a, 'alp')).toBe(true);
    expect(matchesQuery(b, 'SYNC')).toBe(true);
    expect(matchesQuery(c, 'sync')).toBe(false);
  });

  it('never matches an empty query', () => {
    expect(matchesQuery(a, '   ')).toBe(false);
  });
});

describe('groupByDate', () => {
  it('groups tasks by date and keeps their order', () => {
    const groups = groupByDate([c, a, b]);
    expect([...groups.keys()]).toEqual(['2026-11-05', '2026-11-03']);
    expect(groups.get('2026-11-05')).toEqual([c, a]);
  });
});
