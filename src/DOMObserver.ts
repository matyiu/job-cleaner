import type { JobParser } from "./JobParser";
import type { JobState } from "./JobState";
import type { OnAppliedJob } from "./OnAppliedJob";

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

    const handleJobDescriptionChanged = debounce(() => {
      this.jobParser.parseDescription(
        this.jobState.get(),
        jobDescriptionContainer
      );

      handler();

      this.onAppliedJob?.handle();
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
