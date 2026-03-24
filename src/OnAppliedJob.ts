import type { JobState } from "./JobState";
import { AdvanceEvent, AutoAdvancer } from "./AutoAdvancer";
import { HideJob } from "./HideJob";

const JOB_DETAILS_CONTAINER_SELECTOR = '.jobs-search__job-details--container';
const JOB_DETAILS_APPLIED_SELECTOR = '.jobs-s-apply a[href*="jobs-tracker"]';

export class OnAppliedJob {
  constructor(
    private readonly jobState: JobState,
    private readonly autoAdvancer: AutoAdvancer,
    private readonly hideJob: HideJob
  ) { }

  public async handle(): Promise<void> {
    const container = document.querySelector(JOB_DETAILS_CONTAINER_SELECTOR) as HTMLElement;
    const ariaLabel = container?.ariaLabel?.trim();
    if (!ariaLabel) return;

    if (!container.querySelector(JOB_DETAILS_APPLIED_SELECTOR)) {
      return;
    }

    const jobs = this.jobState.get();
    const visibleJobs = jobs.filter(job => !job.isHidden());
    const currentJob = visibleJobs.find(job => job.title === ariaLabel);
    if (!currentJob) {
      return;
    }

    const currentJobIndex = visibleJobs.findIndex(job => job.id === currentJob.id);

    this.hideJob.execute(currentJob);
    this.autoAdvancer.advance(visibleJobs[currentJobIndex + 1], AdvanceEvent.APPLIED);
  }
}
