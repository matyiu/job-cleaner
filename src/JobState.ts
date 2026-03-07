import type { Job } from "./Job";

export class JobState {
  private jobs: Job[] = [];

  public update(jobs: Job[]): void {
    const existingJobsMap = new Map(this.jobs.map(job => [job.id, job]));

    this.jobs = jobs.map(job => {
      const existingJob = existingJobsMap.get(job.id);
      const existingDescription = existingJob?.getDescription();
      if (existingDescription && !job.getDescription()) {
        job.updateDescription(existingDescription);
      }
      return job;
    });
  }

  public get(): Job[] {
    return this.jobs;
  }
}

