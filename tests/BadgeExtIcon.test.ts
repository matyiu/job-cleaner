import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadgeExtIcon } from "../src/BadgeExtIcon";

describe("BadgeExtIcon", () => {
  let badgeExtIcon: BadgeExtIcon;

  beforeEach(() => {
    badgeExtIcon = new BadgeExtIcon();
    vi.restoreAllMocks();
  });

  describe("isJobSearchPage", () => {
    it("should return true for linkedin jobs search URLs", () => {
      expect(
        badgeExtIcon.isJobSearchPage("https://www.linkedin.com/jobs/search/?keywords=developer")
      ).toBe(true);
      expect(
        badgeExtIcon.isJobSearchPage("https://www.linkedin.com/jobs/search-results/?currentJobId=123")
      ).toBe(true);
    });

    it("should return false for non-job-search URLs", () => {
      expect(badgeExtIcon.isJobSearchPage("https://www.linkedin.com/feed/")).toBe(false);
      expect(badgeExtIcon.isJobSearchPage("https://google.com")).toBe(false);
      expect(badgeExtIcon.isJobSearchPage(undefined)).toBe(false);
    });
  });

  describe("getIconPath", () => {
    it("should return active icons when active is true", () => {
      const icons = badgeExtIcon.getIconPath(true);
      expect(icons[16]).toContain("icon-16.png");
      expect(icons[16]).not.toContain("disabled");
    });

    it("should return disabled icons when active is false", () => {
      const icons = badgeExtIcon.getIconPath(false);
      expect(icons[16]).toContain("icon-disabled-16.png");
    });
  });

  describe("updateTabState", () => {
    it("should call chrome.action APIs for active job search page", async () => {
      const setIconMock = vi.fn().mockResolvedValue(undefined);
      const setBadgeBackgroundColorMock = vi.fn().mockResolvedValue(undefined);
      const setBadgeTextMock = vi.fn().mockResolvedValue(undefined);

      vi.stubGlobal("chrome", {
        action: {
          setIcon: setIconMock,
          setBadgeBackgroundColor: setBadgeBackgroundColorMock,
          setBadgeText: setBadgeTextMock,
        },
      });

      await badgeExtIcon.updateTabState(
        101,
        "https://www.linkedin.com/jobs/search/?keywords=dev",
        5
      );

      expect(setIconMock).toHaveBeenCalledWith({
        tabId: 101,
        path: expect.objectContaining({ 16: "icons/icon-16.png" }),
      });
      expect(setBadgeBackgroundColorMock).toHaveBeenCalledWith({
        tabId: 101,
        color: "#E53935",
      });
      expect(setBadgeTextMock).toHaveBeenCalledWith({
        tabId: 101,
        text: "5",
      });
    });

    it("should disable icon and clear badge text for non-job-search page", async () => {
      const setIconMock = vi.fn().mockResolvedValue(undefined);
      const setBadgeBackgroundColorMock = vi.fn().mockResolvedValue(undefined);
      const setBadgeTextMock = vi.fn().mockResolvedValue(undefined);

      vi.stubGlobal("chrome", {
        action: {
          setIcon: setIconMock,
          setBadgeBackgroundColor: setBadgeBackgroundColorMock,
          setBadgeText: setBadgeTextMock,
        },
      });

      await badgeExtIcon.updateTabState(102, "https://google.com");

      expect(setIconMock).toHaveBeenCalledWith({
        tabId: 102,
        path: expect.objectContaining({ 16: "icons/icon-disabled-16.png" }),
      });
      expect(setBadgeTextMock).toHaveBeenCalledWith({
        tabId: 102,
        text: "",
      });
      expect(setBadgeBackgroundColorMock).not.toHaveBeenCalled();
    });

    it("should preserve stored count when updating tab state without explicit hiddenCount", async () => {
      const setIconMock = vi.fn().mockResolvedValue(undefined);
      const setBadgeBackgroundColorMock = vi.fn().mockResolvedValue(undefined);
      const setBadgeTextMock = vi.fn().mockResolvedValue(undefined);

      vi.stubGlobal("chrome", {
        action: {
          setIcon: setIconMock,
          setBadgeBackgroundColor: setBadgeBackgroundColorMock,
          setBadgeText: setBadgeTextMock,
        },
      });

      const url = "https://www.linkedin.com/jobs/search/?keywords=dev";
      await badgeExtIcon.updateTabState(101, url, 7);
      expect(setBadgeTextMock).toHaveBeenLastCalledWith({ tabId: 101, text: "7" });

      // Tab update triggered by browser without hiddenCount
      await badgeExtIcon.updateTabState(101, url);
      expect(setBadgeTextMock).toHaveBeenLastCalledWith({ tabId: 101, text: "7" });
    });

    it("should clean up stored count on removeTab", async () => {
      const setIconMock = vi.fn().mockResolvedValue(undefined);
      const setBadgeBackgroundColorMock = vi.fn().mockResolvedValue(undefined);
      const setBadgeTextMock = vi.fn().mockResolvedValue(undefined);

      vi.stubGlobal("chrome", {
        action: {
          setIcon: setIconMock,
          setBadgeBackgroundColor: setBadgeBackgroundColorMock,
          setBadgeText: setBadgeTextMock,
        },
      });

      const url = "https://www.linkedin.com/jobs/search/?keywords=dev";
      await badgeExtIcon.updateTabState(101, url, 12);
      badgeExtIcon.removeTab(101);

      await badgeExtIcon.updateTabState(101, url);
      expect(setBadgeTextMock).toHaveBeenLastCalledWith({ tabId: 101, text: "" });
    });
  });
});
