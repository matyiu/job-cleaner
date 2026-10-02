import type { JobState } from "./JobState";
import { AdvanceEvent, AutoAdvancer } from "./AutoAdvancer";
import { HideJob } from "./HideJob";
import type { JobApplicationRepository } from "./JobApplicationRepository";
import { JobApplicationRecord } from "./JobApplicationRecord";
import { Job } from "./Job";

const JOB_DETAILS_CONTAINER_SELECTOR = '.jobs-search__job-details--container, .jobs-search__job-details, #job-details';
const JOB_DETAILS_APPLIED_SELECTOR = '.jobs-s-apply a[href*="jobs-tracker"]';

export class OnAppliedJob {
  private readonly recordedJobIds = new Set<string>();

  constructor(
    private readonly jobState: JobState,
    private readonly autoAdvancer: AutoAdvancer,
    private readonly hideJob: HideJob,
    private readonly jobApplicationRepository?: JobApplicationRepository
  ) { }

  public async recordAppliedJob(job: Job): Promise<void> {
    if (!this.jobApplicationRepository || this.recordedJobIds.has(job.id)) {
      return;
    }
    this.recordedJobIds.add(job.id);

    let description = job.getDescription();
    if (!description) {
      const descEl = document.querySelector('#job-details, .jobs-search__job-details');
      if (descEl && descEl.textContent) {
        description = descEl.textContent.trim();
        job.updateDescription(description);
      }
    }

    const record = new JobApplicationRecord({
      id: job.id,
      title: job.title,
      company: job.getCompany(),
      location: job.getLocation() ?? '',
      description: description ?? '',
      appliedAt: new Date().toISOString(),
      status: 'applied',
    });

    try {
      await this.jobApplicationRepository.add(record);
      console.log('[JobCleaner] Recorded applied job:', job.id, job.title, job.getCompany());
    } catch (err) {
      console.error('[JobCleaner] Error saving applied job to storage:', err);
    }
  }

  public async handle(): Promise<void> {
    const container = document.querySelector(JOB_DETAILS_CONTAINER_SELECTOR) as HTMLElement;
    if (!container) return;

    const isAppliedInDetails = this.isDetailsContainerApplied(container) || this.isModalApplied();

    const jobs = this.jobState.get();
    const currentJob = this.resolveCurrentJob(container, jobs);

    if (!isAppliedInDetails && (!currentJob || !currentJob.isApplied())) {
      return;
    }

    let jobToRecord = currentJob;
    if (!jobToRecord) {
      jobToRecord = this.extractJobFromDetails(container);
    }

    if (jobToRecord) {
      await this.recordAppliedJob(jobToRecord);

      if (currentJob) {
        const visibleJobs = jobs.filter(j => !j.isHidden() || j.id === currentJob.id);
        const currentJobIndex = visibleJobs.findIndex(j => j.id === currentJob.id);
        const nextJob = visibleJobs[currentJobIndex + 1] || jobs.find(j => !j.isHidden() && j.id !== currentJob.id);

        this.hideJob.execute(currentJob);
        this.autoAdvancer.advance(nextJob, AdvanceEvent.APPLIED);
      }
    }
  }

  private resolveCurrentJob(container: HTMLElement, jobs: Job[]): Job | null {
    // 1. URL match (query param or pathname)
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const urlMatch = currentUrl.match(/(?:\/jobs\/view\/|currentJobId=)(\d+)/);
    if (urlMatch && urlMatch[1]) {
      const matchJob = jobs.find(j => j.id === urlMatch[1]);
      if (matchJob) return matchJob;
    }

    // 2. Active DOM item match
    const activeCard = document.querySelector('.jobs-search-results-list__list-item--active, .job-card-container--active, [aria-current="true"], [aria-current="page"]');
    if (activeCard) {
      const activeId = activeCard.getAttribute('data-occludable-job-id') || activeCard.getAttribute('data-job-id');
      if (activeId) {
        const matchJob = jobs.find(j => j.id === activeId);
        if (matchJob) return matchJob;
      }
    }

    // 3. Title fuzzy match
    const containerTitle = container.ariaLabel?.trim() ||
      container.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1, h2')?.textContent?.trim();

    if (containerTitle) {
      const cleanContainer = containerTitle.toLowerCase().replace(/\s+/g, ' ');
      const matchJob = jobs.find(j => {
        const cleanJobTitle = j.title.toLowerCase().replace(/\s+/g, ' ');
        return cleanContainer === cleanJobTitle || cleanContainer.includes(cleanJobTitle) || cleanJobTitle.includes(cleanContainer);
      });
      if (matchJob) return matchJob;
    }

    return null;
  }

  private extractJobFromDetails(container: HTMLElement): Job {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const urlMatch = currentUrl.match(/(?:\/jobs\/view\/|currentJobId=)(\d+)/);
    const id = urlMatch ? urlMatch[1] : `job-${Date.now()}`;

    const title = container.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1, h2')?.textContent?.trim() || 'Oferta de empleo';
    const company = container.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .jobs-search__company-name, a[href*="/company/"]')?.textContent?.trim() || 'Empresa N/A';
    const location = container.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet, .jobs-search__location')?.textContent?.trim() || '';
    const descEl = container.querySelector('#job-details, .jobs-search__job-details');
    const description = descEl?.textContent?.trim() || '';

    const dummyEl = document.createElement('div');
    return new Job(id, title, company, dummyEl, description, location);
  }

  private isDetailsContainerApplied(container: HTMLElement): boolean {
    // 1. Explicit link or SVG icon indicators (including real LinkedIn DOM selectors)
    if (
      container.querySelector(JOB_DETAILS_APPLIED_SELECTOR) ||
      container.querySelector('svg#signal-success-small, svg[id*="signal-success"], svg[data-test-icon*="signal-success"]') ||
      container.querySelector('a[href*="safety/go"], a[href*="jobs-tracker"]') ||
      document.querySelector('svg#signal-success-small, svg[id*="signal-success"]')
    ) {
      return true;
    }

    // 2. Heading or status text patterns
    const textContent = container.textContent || '';
    const appliedTextRegex = /(estado de la solicitud|application status|solicitado en el sitio|solicitado hace|solicitada hace|solicitaste este|applied on company|applied \d+\s*(min|hour|day|seg|minuto|hora|d[íi]a))/i;
    if (appliedTextRegex.test(textContent)) {
      return true;
    }

    // 3. Selective element check for word boundary matches
    const checkElements = Array.from(container.querySelectorAll('h2, h3, h4, p, span, a, div'));
    const wordRegex = /\b(solicitado|solicitada|solicitados|solicitadas|solicitaste|postulado|postulada)\b/i;

    for (const el of checkElements) {
      if (el.children.length <= 2) {
        const text = el.textContent?.trim() || '';
        if (text && text.length < 150 && wordRegex.test(text)) {
          if (!/solicitud sencilla|easy apply|^solicitar$|solicitantes/i.test(text)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private isModalApplied(): boolean {
    const modal = document.querySelector('.jobs-easy-apply-modal, .artdeco-modal');
    if (!modal) return false;

    const text = modal.textContent?.trim() || '';
    const successModalRegex = /(se envi[oó] tu solicitud|solicitud enviada|postulaci[oó]n enviada|your application was sent|application sent)/i;
    return successModalRegex.test(text);
  }
}
