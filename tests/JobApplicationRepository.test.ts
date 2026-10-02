import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobApplicationRepository } from '../src/JobApplicationRepository';
import { JobApplicationRecord } from '../src/JobApplicationRecord';

describe('JobApplicationRepository', () => {
  let mockStorage: Record<string, any> = {};

  beforeEach(() => {
    mockStorage = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn().mockImplementation((keys: string[]) => {
            const result: Record<string, any> = {};
            keys.forEach(k => {
              result[k] = mockStorage[k];
            });
            return Promise.resolve(result);
          }),
          set: vi.fn().mockImplementation((obj: Record<string, any>) => {
            Object.assign(mockStorage, obj);
            return Promise.resolve();
          }),
        },
      },
    };
  });

  it('should return empty list when no jobs saved', async () => {
    const repo = new JobApplicationRepository();
    const result = await repo.getAll();
    expect(result).toEqual([]);
  });

  it('should add application record and retrieve it', async () => {
    const repo = new JobApplicationRepository();
    const record = new JobApplicationRecord({
      id: 'job-1',
      title: 'Senior Dev',
      company: 'Awesome Co',
      appliedAt: '2026-09-18T12:00:00.000Z',
    });

    await repo.add(record);

    const all = await repo.getAll();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('job-1');
    expect(all[0].title).toBe('Senior Dev');
  });

  it('should preserve existing original record fields (immutability) if added again with same id', async () => {
    const repo = new JobApplicationRepository();
    const r1 = new JobApplicationRecord({
      id: 'job-1',
      title: 'Original Title',
      company: 'Original Co',
      description: 'Original Description',
      appliedAt: '2026-09-18T10:00:00.000Z',
    });
    const r2 = new JobApplicationRecord({
      id: 'job-1',
      title: 'New Title',
      company: 'New Co',
      description: 'New Description',
      appliedAt: '2026-09-19T11:00:00.000Z',
    });

    await repo.add(r1);
    await repo.add(r2);

    const all = await repo.getAll();
    expect(all.length).toBe(1);
    expect(all[0].title).toBe('Original Title');
    expect(all[0].company).toBe('Original Co');
    expect(all[0].description).toBe('Original Description');
    expect(all[0].appliedAt).toBe('2026-09-18T10:00:00.000Z');
  });

  it('should clear all records', async () => {
    const repo = new JobApplicationRepository();
    const r1 = new JobApplicationRecord({
      id: 'job-1',
      title: 'Dev',
      company: 'Co',
      appliedAt: '2026-09-18T10:00:00.000Z',
    });

    await repo.add(r1);
    await repo.clear();

    const all = await repo.getAll();
    expect(all).toEqual([]);
  });
});
