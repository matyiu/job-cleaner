import { describe, it, expect } from 'vitest';
import { JobApplicationRecord } from '../src/JobApplicationRecord';

describe('JobApplicationRecord', () => {
  it('should initialize with default values', () => {
    const record = new JobApplicationRecord({
      id: 'job-123',
      title: 'Software Engineer',
      company: 'Acme Corp',
      appliedAt: '2026-09-18T10:00:00.000Z',
    });

    expect(record.id).toBe('job-123');
    expect(record.title).toBe('Software Engineer');
    expect(record.company).toBe('Acme Corp');
    expect(record.status).toBe('applied');
    expect(record.location).toBe('');
    expect(record.description).toBe('');
    expect(record.notes).toBe('');
    expect(record.tags).toEqual([]);
  });

  it('should compute correct day key YYYY-MM-DD', () => {
    const record = new JobApplicationRecord({
      id: 'job-123',
      title: 'Frontend Engineer',
      company: 'Tech Corp',
      appliedAt: '2026-09-18T15:30:00.000Z',
    });

    const dayKey = record.getDayKey();
    expect(dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should serialize to and from JSON including description', () => {
    const data = {
      id: 'job-456',
      title: 'Backend Developer',
      company: 'Global Inc',
      location: 'Madrid',
      description: 'Role involving Node.js and TypeScript',
      appliedAt: '2026-09-17T08:00:00.000Z',
      status: 'applied',
      notes: 'Applied via Easy Apply',
      tags: ['remote', 'typescript'],
    };

    const record = JobApplicationRecord.fromJSON(data);
    expect(record.id).toBe('job-456');
    expect(record.location).toBe('Madrid');
    expect(record.description).toBe('Role involving Node.js and TypeScript');
    expect(record.toJSON()).toEqual(data);
  });
});
