import type { JobApplicationRecord } from "./JobApplicationRecord";

export interface DailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export class ApplicationStats {
  constructor(private readonly records: JobApplicationRecord[]) {}

  public getTotalCount(): number {
    return this.records.length;
  }

  public getTodayCount(): number {
    return this.records.filter(r => r.isToday()).length;
  }

  public getDailyBreakdown(): DailyCount[] {
    const countsMap = new Map<string, number>();

    for (const record of this.records) {
      const day = record.getDayKey();
      countsMap.set(day, (countsMap.get(day) || 0) + 1);
    }

    const result: DailyCount[] = [];
    countsMap.forEach((count, date) => {
      result.push({ date, count });
    });

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }
}
