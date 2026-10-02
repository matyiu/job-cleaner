import { describe, it, expect } from 'vitest';
import { ApplicationStats } from '../src/ApplicationStats';
import { JobApplicationRecord } from '../src/JobApplicationRecord';

describe('ApplicationStats', () => {
  it('should return 0 counts when records array is empty', () => {
    const stats = new ApplicationStats([]);
    expect(stats.getTotalCount()).toBe(0);
    expect(stats.getTodayCount()).toBe(0);
    expect(stats.getDailyBreakdown()).toEqual([]);
  });

  it('should correctly calculate total, today count, and daily breakdown', () => {
    const todayStr = new Date().toISOString();
    const records = [
      new JobApplicationRecord({
        id: '1',
        title: 'Job 1',
        company: 'Comp A',
        appliedAt: todayStr,
      }),
      new JobApplicationRecord({
        id: '2',
        title: 'Job 2',
        company: 'Comp B',
        appliedAt: todayStr,
      }),
      new JobApplicationRecord({
        id: '3',
        title: 'Job 3',
        company: 'Comp C',
        appliedAt: '2026-09-10T10:00:00.000Z',
      }),
    ];

    const stats = new ApplicationStats(records);
    expect(stats.getTotalCount()).toBe(3);
    expect(stats.getTodayCount()).toBe(2);

    const breakdown = stats.getDailyBreakdown();
    expect(breakdown.length).toBe(2);
    expect(breakdown[0].date).toBe(new JobApplicationRecord({ id: '1', title: 'a', company: 'b', appliedAt: todayStr }).getDayKey());
    expect(breakdown[0].count).toBe(2);
  });
});
