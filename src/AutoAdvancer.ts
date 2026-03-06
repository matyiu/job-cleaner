import type { Job } from "./Job";
import type { Storage } from "./Storage";

const NEXT_BUTTON_SELECTOR = '.jobs-search-pagination__button.jobs-search-pagination__button--next';

export class AutoAdvancer {
  constructor(
    private readonly storage: Storage
  ) { }

  public async advance(nextJob: Job | undefined): Promise<void> {
    const config = await this.storage.get();
    if (!config.autoAdvance.enabled) return;

    setTimeout(() => {
      if (nextJob) {
        nextJob.select();
      } else {
        const nextButton = document.querySelector(NEXT_BUTTON_SELECTOR) as HTMLButtonElement;
        if (nextButton && !nextButton.disabled) {
          nextButton.click();
        }
      }
    }, config.autoAdvance.delay);
  }
}
