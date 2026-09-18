export class BadgeExtIcon {
  private tabCounts: Map<number, number> = new Map();

  private static readonly ACTIVE_ICONS = {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png",
  };

  private static readonly DISABLED_ICONS = {
    16: "icons/icon-disabled-16.png",
    32: "icons/icon-disabled-32.png",
    48: "icons/icon-disabled-48.png",
    128: "icons/icon-disabled-128.png",
  };

  private static readonly JOB_SEARCH_PATTERNS = [
    /^https?:\/\/(www\.)?linkedin\.com\/jobs\/search(\/|\?|$)/,
    /^https?:\/\/(www\.)?linkedin\.com\/jobs\/search-results(\/|\?|$)/,
  ];

  public isJobSearchPage(url?: string): boolean {
    if (!url) return false;
    return BadgeExtIcon.JOB_SEARCH_PATTERNS.some((pattern) => pattern.test(url));
  }

  public getIconPath(isActive: boolean): Record<number, string> {
    return isActive ? BadgeExtIcon.ACTIVE_ICONS : BadgeExtIcon.DISABLED_ICONS;
  }

  public async updateTabState(
    tabId: number,
    url?: string,
    hiddenCount?: number
  ): Promise<void> {
    const isActive = this.isJobSearchPage(url);
    const icons = this.getIconPath(isActive);

    if (hiddenCount !== undefined) {
      this.tabCounts.set(tabId, hiddenCount);
    }

    const currentCount = this.tabCounts.get(tabId);

    if (typeof chrome !== "undefined" && chrome.action) {
      await chrome.action.setIcon({ tabId, path: icons });

      if (isActive) {
        await chrome.action.setBadgeBackgroundColor({
          tabId,
          color: "#E53935",
        });
        const badgeText = currentCount !== undefined ? String(currentCount) : "";
        await chrome.action.setBadgeText({ tabId, text: badgeText });
      } else {
        this.tabCounts.delete(tabId);
        await chrome.action.setBadgeText({ tabId, text: "" });
      }
    }
  }

  public removeTab(tabId: number): void {
    this.tabCounts.delete(tabId);
  }
}
