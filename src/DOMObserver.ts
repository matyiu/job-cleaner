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

  public init(): void {
    const jobListContainer = document.querySelector(JOB_SEARCH_LIST_DOM_SELECTOR);
    if (!jobListContainer) {
      return;
    }

    const callback = debounce(() => {
      alert('list refreshed!');
    }, 5000);

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

