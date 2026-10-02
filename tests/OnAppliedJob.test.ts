import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OnAppliedJob } from '../src/OnAppliedJob';
import { JobState } from '../src/JobState';
import { AutoAdvancer } from '../src/AutoAdvancer';
import { HideJob } from '../src/HideJob';
import { JobApplicationRepository } from '../src/JobApplicationRepository';
import { Job } from '../src/Job';

describe('OnAppliedJob', () => {
  let mockStorageData: Record<string, any> = {};

  beforeEach(() => {
    mockStorageData = {};
    (globalThis as any).chrome = {
      storage: {
        sync: {
          get: vi.fn().mockResolvedValue({ autoAdvance: { enabled: false, delay: 500 }, hiddenJobs: { data: [] } }),
        },
        local: {
          get: vi.fn().mockImplementation((keys: string[]) => {
            const res: Record<string, any> = {};
            keys.forEach(k => { res[k] = mockStorageData[k]; });
            return Promise.resolve(res);
          }),
          set: vi.fn().mockImplementation((obj: Record<string, any>) => {
            Object.assign(mockStorageData, obj);
            return Promise.resolve();
          }),
        },
      },
    };
    document.body.innerHTML = '';
  });

  it('should record application via recordAppliedJob with full description and details', async () => {
    const jobState = new JobState();
    const storageMock = {
      get: vi.fn().mockResolvedValue({ autoAdvance: { enabled: false, delay: 500 }, hiddenJobs: { data: [] } }),
      setHiddenJobs: vi.fn().mockResolvedValue(undefined),
    } as any;
    const hideJob = new HideJob(storageMock);
    const autoAdvancer = new AutoAdvancer(storageMock);
    const repository = new JobApplicationRepository();

    const postEl = document.createElement('div');
    const job = new Job('job-999', 'Senior TypeScript Developer', 'TechCorp', postEl, 'Great TS role description');
    jobState.update([job]);

    const onAppliedJob = new OnAppliedJob(jobState, autoAdvancer, hideJob, repository);
    await onAppliedJob.recordAppliedJob(job);

    const recorded = await repository.getAll();
    expect(recorded.length).toBe(1);
    expect(recorded[0].id).toBe('job-999');
    expect(recorded[0].title).toBe('Senior TypeScript Developer');
    expect(recorded[0].company).toBe('TechCorp');
    expect(recorded[0].description).toBe('Great TS role description');
  });

  it('should record application and hide job when applied container with text status is present', async () => {
    const jobState = new JobState();
    const storageMock = {
      get: vi.fn().mockResolvedValue({ autoAdvance: { enabled: false, delay: 500 }, hiddenJobs: { data: [] } }),
      setHiddenJobs: vi.fn().mockResolvedValue(undefined),
    } as any;
    const hideJob = new HideJob(storageMock);
    const autoAdvancer = new AutoAdvancer(storageMock);
    const repository = new JobApplicationRepository();

    const postEl = document.createElement('div');
    const job = new Job('job-777', 'Lead Engineer', 'BigTech', postEl, 'Lead role description');
    jobState.update([job]);

    // Setup DOM for detail container with "Solicitado" text
    const containerEl = document.createElement('div');
    containerEl.className = 'jobs-search__job-details--container';
    containerEl.setAttribute('aria-label', 'Lead Engineer');

    const applyBox = document.createElement('div');
    applyBox.className = 'jobs-s-apply';
    applyBox.textContent = 'Solicitado hace 2 min';
    containerEl.appendChild(applyBox);
    document.body.appendChild(containerEl);

    const onAppliedJob = new OnAppliedJob(jobState, autoAdvancer, hideJob, repository);
    await onAppliedJob.handle();

    const recorded = await repository.getAll();
    expect(recorded.length).toBe(1);
    expect(recorded[0].id).toBe('job-777');
    expect(recorded[0].title).toBe('Lead Engineer');
    expect(recorded[0].company).toBe('BigTech');
    expect(recorded[0].description).toBe('Lead role description');
  });

  it('should NOT record application if job is not applied', async () => {
    const jobState = new JobState();
    const storageMock = {
      get: vi.fn().mockResolvedValue({ hiddenJobs: { data: [] } }),
      setHiddenJobs: vi.fn().mockResolvedValue(undefined),
    } as any;
    const hideJob = new HideJob(storageMock);
    const autoAdvancer = new AutoAdvancer(storageMock);
    const repository = new JobApplicationRepository();

    const postEl = document.createElement('div');
    const job = new Job('job-888', 'Junior Dev', 'SmallCo', postEl);
    jobState.update([job]);

    const containerEl = document.createElement('div');
    containerEl.className = 'jobs-search__job-details--container';
    containerEl.setAttribute('aria-label', 'Junior Dev');
    document.body.appendChild(containerEl);

    const onAppliedJob = new OnAppliedJob(jobState, autoAdvancer, hideJob, repository);
    await onAppliedJob.handle();

    const recorded = await repository.getAll();
    expect(recorded.length).toBe(0);
  });
});
