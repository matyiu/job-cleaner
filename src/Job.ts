import type { Config } from "./Config";

export class Job {
  constructor(
    public readonly id: string,
    private readonly title: string,
    private readonly company: string,
    private readonly post: HTMLElement,
    private description?: string,
  ) { }

  updateDescription(description: string): void {
    this.description = description;
  }

  hide(): void {
    this.post.style.display = 'none';
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

      const regex = new RegExp(`(?<![a-zA-Z0-9])${escapedKeyword}(?![a-zA-Z0-9+#.])`, 'i');

      return regex.test(this.title) || regex.test(this.description ?? '');
    }

    if (whitelist.enabled && whitelist.data.some(keywordMatch)) return false;

    return keywords.enabled && keywords.data.some(keywordMatch);
  }
}
