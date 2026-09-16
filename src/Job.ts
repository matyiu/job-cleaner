import type { Config, KeywordConfig } from "./Config";

export class Job {
  constructor(
    public readonly id: string,
    public readonly title: string,
    private readonly company: string,
    private readonly post: HTMLElement,
    private description?: string,
  ) { }

  updateDescription(description: string): void {
    this.description = description;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  hide(): void {
    this.post.style.display = 'none';
    const topWrapper = this.post.closest('.ec39a3eb, li') as HTMLElement;
    if (topWrapper && topWrapper !== this.post && topWrapper.parentElement !== document.body) {
      topWrapper.style.display = 'none';
    }
  }

  show(): void {
    this.post.style.display = '';
    const topWrapper = this.post.closest('.ec39a3eb, li') as HTMLElement;
    if (topWrapper) {
      topWrapper.style.display = '';
    }
  }

  select(): void {
    const clickable = (
      this.post.querySelector('*[data-job-id]') ||
      (this.post.getAttribute('role') === 'button' ? this.post : null) ||
      this.post.querySelector('[role="button"]') ||
      this.post
    ) as HTMLElement;

    clickable?.click();
  }

  isHidden(): boolean {
    return this.post.style.display === 'none';
  }

  isApplied(): boolean {
    const elements = Array.from(this.post.querySelectorAll('p, span, div, li, a'));
    return elements.some((el) => {
      const text = el.textContent?.trim().toLowerCase();
      if (!text) return false;
      return (
        text === 'solicitado' ||
        text === 'solicitados' ||
        text === 'solicitada' ||
        text === 'solicitadas' ||
        text === 'applied' ||
        text.startsWith('solicitad') ||
        text.startsWith('applied')
      );
    });
  }

  onDismiss(callback: () => void): void {
    const dismissBtn = (
      this.post.querySelector('button[aria-label*="Descartar"], button[aria-label*="Dismiss"], button.job-card-home__dismiss-btn') ||
      this.post.querySelector('svg#close-small')?.closest('button')
    ) as HTMLElement;

    if (dismissBtn && !dismissBtn.dataset.jobFilterDismissBound) {
      dismissBtn.dataset.jobFilterDismissBound = 'true';
      dismissBtn.addEventListener('click', () => {
        callback();
      });
    }
  }

  shouldHide({ keywords, companies, whitelist, hiddenJobs }: Config): boolean {
    if (this.isApplied()) {
      return true;
    }

    const wasHiddenBefore = hiddenJobs.data.findIndex(id => id === this.id) > -1;
    if (wasHiddenBefore) {
      return true;
    }

    if (!keywords.enabled && !companies.enabled) {
      return false;
    }

    if (companies.enabled) {
      const cleanJobCompany = this.company.trim().toLowerCase();
      const companyMatch = companies.data.some((company) => {
        const cleanConfigCompany = company.trim().toLowerCase();
        return (
          cleanConfigCompany.length > 0 &&
          (cleanJobCompany === cleanConfigCompany ||
            cleanJobCompany.includes(cleanConfigCompany) ||
            cleanConfigCompany.includes(cleanJobCompany))
        );
      });
      if (companyMatch) {
        return true;
      }
    }

    const keywordMatch = (keyword: string): boolean => {
      const regex = this.createKeywordRegex(keyword);
      return regex.test(this.title) || regex.test(this.description ?? '');
    };

    if (whitelist.enabled && this.matchesWhitelist(whitelist.data)) return false;

    return keywords.enabled && this.matchesKeywords(keywords);
  }

  private matchesWhitelist(whitelist: string[]): boolean {
    return whitelist.some((keyword: string) => {
      const regex = this.createKeywordRegex(keyword);

      return regex.test(this.title) || regex.test(this.description ?? '');
    });
  }

  private matchesKeywords(keywords: KeywordConfig): boolean {
    const matchesTitle = (keyword: string) => {
      const regex = this.createKeywordRegex(keyword);

      return regex.test(this.title);
    };

    const matchesDescription = (keyword: string) => {
      const regex = this.createKeywordRegex(keyword);

      return regex.test(this.description ?? '');
    };

    if (keywords.anywhere.some(keyword => matchesTitle(keyword) || matchesDescription(keyword))) {
      return true;
    }

    if (keywords.title.some(matchesTitle)) {
      return true;
    }

    if (keywords.description.some(matchesDescription)) {
      return true;
    }

    return false;
  }

  private createKeywordRegex(keyword: string): RegExp {
    const trimmed = keyword.trim();
    const escapedKeyword = trimmed.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return new RegExp(`(?<![a-zA-Z0-9])${escapedKeyword}(?![a-zA-Z0-9+#.])`, 'i');
  }
}
