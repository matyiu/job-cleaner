import type { Job } from "./Job";

export class JobState {
  private jobs: Job[] = [];

  public update(jobs: Job[]): void {
    this.jobs = jobs;
  }

  public get(): Job[] {
    return this.jobs;
  }
}

