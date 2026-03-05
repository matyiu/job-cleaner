import type { JobParser } from "./JobParser";
import type { Storage } from "./Storage";

const JOB_SEARCH_LIST_DOM_SELECTOR = '.scaffold-layout__list';

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
  private observer: MutationObserver | undefined;

  constructor(private readonly jobParser: JobParser, private readonly storage: Storage) { }

  public async init(): Promise<void> {
    const jobListContainer = document.querySelector(JOB_SEARCH_LIST_DOM_SELECTOR) as HTMLElement;
    if (!jobListContainer) {
      return;
    }

    const config = await this.storage.get();

    const callback = debounce(() => {
      const jobs = this.jobParser.parse(jobListContainer);

      console.log(jobs, config);
      debugger;

      jobs.forEach(job => {
        if (job.shouldHide(config)) {
          job.hide();
        }
      });
    }, 1000);

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          callback();
        }
      }
    });

    this.observer.observe(jobListContainer, {
      childList: true,
      subtree: true,
    })
  }
}

