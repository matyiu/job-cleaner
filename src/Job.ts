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
  }

  show(): void {
    this.post.style.display = '';
  }

  select(): void {
    (this.post.querySelector('*[data-job-id]') as HTMLElement).click();
  }

  isHidden(): boolean {
    return this.post.style.display === 'none';
  }

  shouldHide({ keywords, companies, whitelist, hiddenJobs }: Config): boolean {
    const wasHiddenBefore = hiddenJobs.data.findIndex(id => id === this.id) > -1;
    if (wasHiddenBefore) {
      return true;
    }

    if (!keywords.enabled && !companies.enabled) {
      return false;
    }

    if (companies.enabled && companies.data.findIndex(company => company.toLowerCase() === this.company.toLowerCase()) > -1) {
      return true;
    }

    const keywordMatch = (keyword: string): boolean => {
      const escapedKeyword = keyword.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const regex = this.createKeywordRegex(escapedKeyword);

      return regex.test(this.title) || regex.test(this.description ?? '');
    }

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
    const escapedKeyword = keyword.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return new RegExp(`(?<![a-zA-Z0-9])${escapedKeyword}(?![a-zA-Z0-9+#.])`, 'i');
  }
}
