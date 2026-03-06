import type { Job } from "./Job";
import type { Storage } from "./Storage";

export class HideJob {
  constructor(private readonly storage: Storage) {}

  async execute(job: Job): Promise<void> {
    job.hide();

    const config = await this.storage.get();
    const hiddenJobs = config.hiddenJobs.data;

    if (!hiddenJobs.includes(job.id)) {
      hiddenJobs.push(job.id);
      await this.storage.setHiddenJobs(hiddenJobs);
    }
  }
}
