import type { JobParser } from "./JobParser";
import type { JobState } from "./JobState";

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

  constructor(
    private readonly jobParser: JobParser,
    private readonly jobState: JobState,
  ) { }

  public async init(handler: Procedure): Promise<void> {
    const jobListContainer = document.querySelector(JOB_SEARCH_LIST_DOM_SELECTOR) as HTMLElement;
    if (!jobListContainer) {
      return;
    }

    const callback = debounce(() => {
      this.jobState.update(
        this.jobParser.parse(jobListContainer)
      );

      handler();
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

