import type { JobParser } from "./JobParser";
import type { JobState } from "./JobState";
import type { OnAppliedJob } from "./OnAppliedJob";
import { AdvanceEvent, AutoAdvancer } from "./AutoAdvancer";

const JOB_SEARCH_LIST_DOM_SELECTOR = '.scaffold-layout__list';
const JOB_DESCRIPTION_SELECTOR = '.jobs-search__job-details--container';

type Procedure = ((...args: unknown[]) => void) | (() => void);

function debounce(fn: Procedure, delayInMs: number) {
  let timerId: number;

  return () => {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      fn(...arguments);
    }, delayInMs)
  };
}

export class DOMObserver {
  constructor(
    private readonly jobParser: JobParser,
    private readonly jobState: JobState,
    private readonly onAppliedJob?: OnAppliedJob,
    private readonly autoAdvancer?: AutoAdvancer,
  ) { }

  public async init(handler: Procedure): Promise<void> {
    const jobListContainer = document.querySelector(JOB_SEARCH_LIST_DOM_SELECTOR) as HTMLElement;
    if (!jobListContainer) {
      return;
    }

    const handleJobListChanged = debounce(() => {
      this.jobState.update(
        this.jobParser.parseList(jobListContainer)
      );

      handler();
    }, 1000);

    const jobListObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          handleJobListChanged();
        }
      }
    });

    jobListObserver.observe(jobListContainer, {
      childList: true,
      subtree: true,
    });

    const jobDescriptionContainer = document.querySelector(JOB_DESCRIPTION_SELECTOR) as HTMLElement;
    if (!jobDescriptionContainer) {
      return;
    }

    const handleJobDescriptionChanged = debounce(async () => {
      this.jobParser.parseDescription(
        this.jobState.get(),
        jobDescriptionContainer
      );

      handler();

      this.onAppliedJob?.handle();

      if (this.autoAdvancer) {
        const currentJobTitle = jobDescriptionContainer.ariaLabel?.trim();
        if (!currentJobTitle) return;

        const jobs = this.jobState.get();
        const currentJob = jobs.find(job => job.title === currentJobTitle);
        if (!currentJob) return;

        if (currentJob.isHidden()) {
          const visibleJobs = jobs.filter(job => !job.isHidden());
          const currentJobIndex = visibleJobs.findIndex(job => job.id === currentJob.id);
          this.autoAdvancer.advance(visibleJobs[currentJobIndex + 1], AdvanceEvent.FILTER_HIDDEN);
        }
      }
    }, 1000);

    const jobDescriptionObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          handleJobDescriptionChanged();
        }
      }
    });

    jobDescriptionObserver.observe(jobDescriptionContainer, {
      subtree: true,
      childList: true,
    });
  }
}
