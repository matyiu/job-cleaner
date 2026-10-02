import type { JobState } from "./JobState";
import { AdvanceEvent, AutoAdvancer } from "./AutoAdvancer";
import { HideJob } from "./HideJob";
import type { JobApplicationRepository } from "./JobApplicationRepository";
import { JobApplicationRecord } from "./JobApplicationRecord";
import type { Job } from "./Job";

const JOB_DETAILS_CONTAINER_SELECTOR = '.jobs-search__job-details--container, .jobs-search__job-details, #job-details';
const JOB_DETAILS_APPLIED_SELECTOR = '.jobs-s-apply a[href*="jobs-tracker"]';

export class OnAppliedJob {
  constructor(
    private readonly jobState: JobState,
    private readonly autoAdvancer: AutoAdvancer,
    private readonly hideJob: HideJob,
    private readonly jobApplicationRepository?: JobApplicationRepository
  ) { }

  public async recordAppliedJob(job: Job): Promise<void> {
    if (!this.jobApplicationRepository) {
      return;
    }
    const record = new JobApplicationRecord({
      id: job.id,
      title: job.title,
      company: job.getCompany(),
      location: job.getLocation() ?? '',
      description: job.getDescription() ?? '',
      appliedAt: new Date().toISOString(),
      status: 'applied',
    });
    await this.jobApplicationRepository.add(record);
  }

  public async handle(): Promise<void> {
    const container = document.querySelector(JOB_DETAILS_CONTAINER_SELECTOR) as HTMLElement;
    if (!container) return;

    const isAppliedInDetails = this.isDetailsContainerApplied(container);

    const currentJobId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('currentJobId') : null;
    const jobs = this.jobState.get();

    const containerTitle = container.ariaLabel?.trim() ||
      container.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1, h2')?.textContent?.trim();

    const currentJob = (currentJobId ? jobs.find(job => job.id === currentJobId) : null) ||
      (containerTitle ? jobs.find(job => job.title === containerTitle || containerTitle.includes(job.title)) : null);

    if (!currentJob) {
      return;
    }

    if (!isAppliedInDetails && !currentJob.isApplied()) {
      return;
    }

    await this.recordAppliedJob(currentJob);

    const visibleJobs = jobs.filter(job => !job.isHidden() || job.id === currentJob.id);
    const currentJobIndex = visibleJobs.findIndex(job => job.id === currentJob.id);
    const nextJob = visibleJobs[currentJobIndex + 1] || jobs.find(job => !job.isHidden() && job.id !== currentJob.id);

    this.hideJob.execute(currentJob);
    this.autoAdvancer.advance(nextJob, AdvanceEvent.APPLIED);
  }

  private isDetailsContainerApplied(container: HTMLElement): boolean {
    if (container.querySelector(JOB_DETAILS_APPLIED_SELECTOR)) {
      return true;
    }

    const checkElements = Array.from(
      container.querySelectorAll('.jobs-s-apply, .jobs-apply-button--top-card, .artdeco-inline-feedback--success, .jobs-post-apply-feed, button[disabled]')
    );

    for (const el of checkElements) {
      const text = el.textContent?.trim().toLowerCase();
      if (text && (text.includes('solicitad') || text.includes('applied') || text.includes('solicitaste'))) {
        return true;
      }
    }

    return false;
  }
}
