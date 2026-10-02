import type { Job } from "./Job";
import type { Storage } from "./Storage";

export enum AdvanceEvent {
  APPLIED = 'applied',
  FILTER_HIDDEN = 'filter_hidden'
}

export class AutoAdvancer {
  private isAdvancingPage = false;
  private lastAdvancedUrl = '';

  constructor(
    private readonly storage: Storage
  ) { }

  public findNextButton(root: ParentNode = document): HTMLButtonElement | null {
    // Strategy 1: data-testid
    const testIdSelectors = [
      'button[data-testid="pagination-controls-next-button-visible"]',
      'button[data-testid="pagination-controls-next-button"]',
      'button[data-testid*="next-button"]',
      'button[data-testid*="pagination-next"]'
    ];
    for (const selector of testIdSelectors) {
      const el = root.querySelector(selector) as HTMLButtonElement | null;
      if (el && !this.isDisabled(el)) return el;
    }

    // Strategy 2: Known class selectors
    const classSelectors = [
      '.jobs-search-pagination__button.jobs-search-pagination__button--next',
      '.artdeco-pagination__button--next',
      '.jobs-search-pagination__button--next',
      'button.jobs-search-pagination__button--next'
    ];
    for (const selector of classSelectors) {
      const el = root.querySelector(selector) as HTMLButtonElement | null;
      if (el && !this.isDisabled(el)) return el;
    }

    // Strategy 3: aria-label
    const ariaSelectors = [
      'button[aria-label*="Siguiente" i]',
      'button[aria-label*="Next" i]',
      'button[aria-label*="página siguiente" i]',
      'button[aria-label*="next page" i]'
    ];
    for (const selector of ariaSelectors) {
      const el = root.querySelector(selector) as HTMLButtonElement | null;
      if (el && !this.isDisabled(el)) return el;
    }

    // Strategy 4: Chevron SVG icon inside a button
    const svgSelectors = [
      'svg#chevron-right-small',
      'svg#chevron-right',
      'svg[data-test-icon*="chevron-right"]'
    ];
    for (const selector of svgSelectors) {
      const svg = root.querySelector(selector);
      const btn = svg?.closest('button') as HTMLButtonElement | null;
      if (btn && !this.isDisabled(btn)) return btn;
    }

    // Strategy 5: Button text content ("Siguiente" / "Next")
    const allButtons = Array.from(root.querySelectorAll('button, [role="button"]'));
    for (const btn of allButtons) {
      const text = btn.textContent?.trim().toLowerCase();
      if (text === 'siguiente' || text === 'next' || text === 'siguiente page' || text === 'next page') {
        const buttonEl = (btn.tagName === 'BUTTON' ? btn : btn.closest('button')) as HTMLButtonElement | null || btn as HTMLButtonElement;
        if (buttonEl && !this.isDisabled(buttonEl)) return buttonEl;
      }
    }

    // Strategy 6: Active pagination item + next sibling in list
    const activePageBtn = root.querySelector('button[aria-current="true"], button[aria-current="page"]');
    if (activePageBtn) {
      const activeLi = activePageBtn.closest('li');
      const nextLi = activeLi?.nextElementSibling;
      const nextBtn = nextLi?.querySelector('button') as HTMLButtonElement | null;
      if (nextBtn && !this.isDisabled(nextBtn)) return nextBtn;
    }

    return null;
  }

  private isDisabled(button: HTMLElement): boolean {
    if ((button as HTMLButtonElement).disabled) return true;
    if (button.getAttribute('aria-disabled') === 'true') return true;
    if (button.classList.contains('disabled') || button.classList.contains('artdeco-button--disabled')) return true;
    return false;
  }

  public async advance(nextJob: Job | undefined, event: AdvanceEvent = AdvanceEvent.FILTER_HIDDEN): Promise<void> {
    const config = await this.storage.get();

    if (!config.autoAdvance?.enabled) {
      return;
    }

    const delay = event === AdvanceEvent.FILTER_HIDDEN ? 0 : config.autoAdvance.delay;

    setTimeout(() => {
      if (nextJob) {
        nextJob.select();
      } else {
        const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
        if (this.isAdvancingPage && this.lastAdvancedUrl === currentUrl) {
          return;
        }

        const nextButton = this.findNextButton();
        if (nextButton) {
          this.isAdvancingPage = true;
          this.lastAdvancedUrl = currentUrl;
          nextButton.click();

          setTimeout(() => {
            this.isAdvancingPage = false;
          }, 3000);
        }
      }
    }, delay);
  }
}
