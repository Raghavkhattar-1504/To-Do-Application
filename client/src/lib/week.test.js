import { describe, expect, it } from 'vitest';
import { fromISODate, isSameDay, startOfWeek, summarize, toISODate, weekDays, weekRange } from './week.js';

describe('startOfWeek', () => {
  it.each([
    ['2026-11-02', '2026-11-02'],
    ['2026-11-04', '2026-11-02'],
    ['2026-11-07', '2026-11-02'],
    ['2026-11-08', '2026-11-02'],
    ['2026-11-09', '2026-11-09'],
  ])('maps %s to Monday %s', (input, monday) => {
    expect(toISODate(startOfWeek(fromISODate(input)))).toBe(monday);
  });

  it('ignores the time of day', () => {
    const lateSunday = new Date(2026, 10, 8, 23, 59);
    expect(toISODate(startOfWeek(lateSunday))).toBe('2026-11-02');
  });
});

describe('weekDays', () => {
  it('returns Monday through Sunday', () => {
    const days = weekDays(fromISODate('2026-11-05'));
    expect(days.map((day) => day.weekday)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(days.map((day) => day.dayOfMonth)).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });

  it('crosses a month and year boundary', () => {
    const days = weekDays(fromISODate('2026-12-31'));
    expect(days.map((day) => day.iso)).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });

  it('gives the inclusive range used for the API query', () => {
    expect(weekRange(fromISODate('2026-11-08'))).toEqual({ from: '2026-11-02', to: '2026-11-08' });
  });
});

describe('isSameDay', () => {
  it('compares calendar days only', () => {
    expect(isSameDay(new Date(2026, 10, 5, 1), new Date(2026, 10, 5, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 10, 5), new Date(2026, 10, 6))).toBe(false);
  });
});

describe('summarize', () => {
  it('counts completed and pending tasks and the completed percentage', () => {
    const tasks = [{ completed: true }, { completed: false }, { completed: true }, { completed: false }];
    expect(summarize(tasks)).toEqual({ completed: 2, pending: 2, total: 4, percent: 50 });
  });

  it('rounds the percentage', () => {
    expect(summarize([{ completed: true }, { completed: false }, { completed: false }]).percent).toBe(33);
  });

  it('returns zeros for an empty week', () => {
    expect(summarize([])).toEqual({ completed: 0, pending: 0, total: 0, percent: 0 });
  });
});
