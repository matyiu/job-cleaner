import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HideJob } from '../src/HideJob';
import { Storage } from '../src/Storage';
import { JobMother } from './mothers/JobMother';
import { ConfigMother } from './mothers/ConfigMother';

vi.mock('../src/Storage');

describe('HideJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hide the job', async () => {
    const storage = new Storage();
    const config = ConfigMother.create().build();
    vi.mocked(storage.get).mockResolvedValue(config);

    const job = JobMother.create().build();
    const hideJob = new HideJob(storage);

    await hideJob.execute(job);

    expect(job.isHidden()).toBe(true);
  });

  it('should add job id to hidden jobs if not already present', async () => {
    const storage = new Storage();
    const config = ConfigMother.create().build();
    vi.mocked(storage.get).mockResolvedValue(config);
    vi.mocked(storage.setHiddenJobs).mockResolvedValue(undefined);

    const job = JobMother.create().build();
    const hideJob = new HideJob(storage);

    await hideJob.execute(job);

    expect(storage.setHiddenJobs).toHaveBeenCalledWith([job['id']]);
  });

  it('should not add duplicate job id to hidden jobs', async () => {
    const storage = new Storage();
    const job = JobMother.create().build();
    const config = ConfigMother.create().withHiddenJobs({ enabled: false, data: [job['id']] }).build();
    vi.mocked(storage.get).mockResolvedValue(config);
    vi.mocked(storage.setHiddenJobs).mockResolvedValue(undefined);

    const hideJob = new HideJob(storage);

    await hideJob.execute(job);

    expect(storage.setHiddenJobs).not.toHaveBeenCalled();
  });
});
