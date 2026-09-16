import type { JobParser } from "./JobParser";
import type { JobState } from "./JobState";
import type { OnAppliedJob } from "./OnAppliedJob";

const JOB_SEARCH_LIST_DOM_SELECTOR = '.scaffold-layout__list, [componentkey="SearchResultsMainContent"], [data-component-type="LazyColumn"], [data-testid="lazy-column"]';
const JOB_DESCRIPTION_SELECTOR = '.jobs-search__job-details, #job-details';

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
  private currentJobListContainer: HTMLElement | null = null;
  private jobListObserver: MutationObserver | null = null;
  private currentDescContainer: HTMLElement | null = null;
  private descObserver: MutationObserver | null = null;

  constructor(
    private readonly jobParser: JobParser,
    private readonly jobState: JobState,
    private readonly onAppliedJob?: OnAppliedJob,
  ) { }

  public async init(handler: Procedure): Promise<void> {
    const runFilter = () => {
      const container = document.querySelector(JOB_SEARCH_LIST_DOM_SELECTOR) as HTMLElement;
      if (container) {
        this.observeJobList(container, handler);
      }

      const descContainer = document.querySelector(JOB_DESCRIPTION_SELECTOR) as HTMLElement;
      if (descContainer) {
        this.observeJobDescription(descContainer, handler);
      }
    };

    runFilter();

    const bodyObserver = new MutationObserver(() => {
      runFilter();
    });

    if (document.body) {
      bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        runFilter();
        if (document.body) {
          bodyObserver.observe(document.body, { childList: true, subtree: true });
        }
      });
    }
  }

  private observeJobList(jobListContainer: HTMLElement, handler: Procedure): void {
    if (this.currentJobListContainer === jobListContainer) {
      return;
    }

    if (this.jobListObserver) {
      this.jobListObserver.disconnect();
    }

    this.currentJobListContainer = jobListContainer;

    const handleJobListChanged = debounce(() => {
      this.jobState.update(
        this.jobParser.parseList(jobListContainer)
      );
      handler();
    }, 300);

    handleJobListChanged();

    this.jobListObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          handleJobListChanged();
          break;
        }
      }
    });

    this.jobListObserver.observe(jobListContainer, {
      childList: true,
      subtree: true,
    });
  }

  private observeJobDescription(jobDescriptionContainer: HTMLElement, handler: Procedure): void {
    if (this.currentDescContainer === jobDescriptionContainer) {
      return;
    }

    if (this.descObserver) {
      this.descObserver.disconnect();
    }

    this.currentDescContainer = jobDescriptionContainer;

    const handleJobDescriptionChanged = debounce(async () => {
      this.jobParser.parseDescription(
        this.jobState.get(),
        jobDescriptionContainer
      );
      handler();
      this.onAppliedJob?.handle();
    }, 300);

    handleJobDescriptionChanged();

    this.descObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          handleJobDescriptionChanged();
          break;
        }
      }
    });

    this.descObserver.observe(jobDescriptionContainer, {
      subtree: true,
      childList: true,
    });
  }
}
