import { BadgeExtIcon } from "./BadgeExtIcon";
import { UPDATE_BADGE } from "./events";

const badgeExtIcon = new BadgeExtIcon();

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === UPDATE_BADGE && sender.tab?.id) {
    badgeExtIcon.updateTabState(sender.tab.id, sender.tab.url, message.hiddenCount);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    badgeExtIcon.updateTabState(activeInfo.tabId, tab.url);
  } catch (err) {
    console.error("Error updating tab icon on activation:", err);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    badgeExtIcon.updateTabState(tabId, tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  badgeExtIcon.removeTab(tabId);
});

