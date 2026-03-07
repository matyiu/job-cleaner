import type { Job } from "./Job";
import type { Storage } from "./Storage";

const NEXT_BUTTON_SELECTOR = '.jobs-search-pagination__button.jobs-search-pagination__button--next';

export enum AdvanceEvent {
  APPLIED = 'applied',
  FILTER_HIDDEN = 'filter_hidden'
}

export class AutoAdvancer {
  constructor(
    private readonly storage: Storage
  ) { }

  public async advance(nextJob: Job | undefined, event: AdvanceEvent = AdvanceEvent.FILTER_HIDDEN): Promise<void> {
    const config = await this.storage.get();

    if (event === AdvanceEvent.APPLIED) {
      if (!config.autoAdvance.enabled) return;
    }

    const delay = event === AdvanceEvent.FILTER_HIDDEN ? 0 : config.autoAdvance.delay;

    setTimeout(() => {
      if (nextJob) {
        nextJob.select();
      } else {
        const nextButton = document.querySelector(NEXT_BUTTON_SELECTOR) as HTMLButtonElement;
        if (nextButton && !nextButton.disabled) {
          nextButton.click();
        }
      }
    }, delay);
  }
}
