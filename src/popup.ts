import type { KeywordConfig, LocationConfig, WorkplaceTypeConfig } from "./Config";
import { CONFIG_UPDATED } from "./events";
import { JobApplicationRepository } from "./JobApplicationRepository";
import { ApplicationStats } from "./ApplicationStats";

document.addEventListener('DOMContentLoaded', () => {
  setupVersion();
  setupStats();
  setupKeywords();
  setupLocations();
  setupWorkplaceTypes();
  setupAutoAdvance();
  setupOtherCards(['companies', 'whitelist']);
});

async function setupStats() {
  const repo = new JobApplicationRepository();
  const records = await repo.getAll();
  const stats = new ApplicationStats(records);

  const totalEl = document.getElementById('stats-total-count');
  const todayEl = document.getElementById('stats-today-count');

  if (totalEl) totalEl.textContent = String(stats.getTotalCount());
  if (todayEl) todayEl.textContent = String(stats.getTodayCount());

  const breakdownListEl = document.getElementById('daily-breakdown-list');
  const breakdownData = stats.getDailyBreakdown();

  if (breakdownListEl) {
    if (breakdownData.length > 0) {
      breakdownListEl.innerHTML = '';
      breakdownData.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'breakdown-item';

        const dateSpan = document.createElement('span');
        dateSpan.className = 'breakdown-date';
        dateSpan.textContent = item.date;

        const countSpan = document.createElement('span');
        countSpan.className = 'breakdown-count';
        countSpan.textContent = `${item.count} ${item.count === 1 ? 'empleo' : 'empleos'}`;

        itemEl.appendChild(dateSpan);
        itemEl.appendChild(countSpan);
        breakdownListEl.appendChild(itemEl);
      });
    }
  }

  const toggleBtn = document.getElementById('toggle-breakdown-btn');
  const breakdownContent = document.getElementById('daily-breakdown-content');
  if (toggleBtn && breakdownContent) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = breakdownContent.classList.contains('hidden');
      if (isHidden) {
        breakdownContent.classList.remove('hidden');
        toggleBtn.textContent = 'Ocultar desglose ▲';
      } else {
        breakdownContent.classList.add('hidden');
        toggleBtn.textContent = 'Ver desglose diario ▼';
      }
    });
  }

  const openDashboardBtn = document.getElementById('open-dashboard-btn');
  if (openDashboardBtn) {
    openDashboardBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
      }
    });
  }
}

function setupVersion() {
  const versionLabel = document.getElementById('version-label');
  if (versionLabel && typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
    const manifest = chrome.runtime.getManifest();
    if (manifest?.version) {
      versionLabel.textContent = `v${manifest.version}`;
    }
  }
}

async function setupKeywords() {
  const card = document.querySelector<HTMLElement>('.feature-card[data-name="keywords"]');
  if (!card) return;

  const toggle = card.querySelector<HTMLInputElement>('.toggle-trigger');
  const content = card.querySelector<HTMLElement>('.card-content');

  if (!toggle || !content) return;

  const values = await getKeywordsFromStorage();

  if (values.enabled) {
    content.classList.remove('hidden');
    toggle.checked = true;
  }

  setupKeywordSubsection(card, 'anywhere', values);
  setupKeywordSubsection(card, 'title', values);
  setupKeywordSubsection(card, 'description', values);

  toggle.addEventListener('change', async () => {
    const currentValues = await getKeywordsFromStorage();
    currentValues.enabled = toggle.checked;

    await chrome.storage.sync.set({ keywords: currentValues });

    if (currentValues.enabled) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }

    configChanged();
  });
}

function setupKeywordSubsection(card: HTMLElement, category: string, values: KeywordConfig) {
  const subsection = card.querySelector<HTMLElement>(`.keyword-subsection[data-category="${category}"]`);
  if (!subsection) return;

  const subsectionHeader = subsection.querySelector<HTMLElement>('.subsection-header');
  const subsectionContent = subsection.querySelector<HTMLElement>('.subsection-content');
  const input = subsection.querySelector<HTMLInputElement>('.chip-input');
  const chipsBox = subsection.querySelector<HTMLElement>('.chips-box');
  const emptyMessage = subsection.querySelector<HTMLElement>('.empty-message');

  if (!subsectionHeader || !subsectionContent || !input || !chipsBox || !emptyMessage) return;

  const setSubsectionContentHeight = () => {
    const isExpanded = subsectionContent.classList.contains('expanded');
    subsectionContent.style.maxHeight = isExpanded ? `${subsectionContent.scrollHeight}px` : '0';
  };

  // 200ms delay for awaiting the max-height to be calculated
  new Promise((resolve) => {
    setTimeout(() => {
      setSubsectionContentHeight();
      resolve(true);
    }, 200);
  });

  subsectionHeader.addEventListener('click', () => {
    subsectionContent.classList.toggle('expanded');
    setSubsectionContentHeight();
  });

  const categoryData = values[category as keyof KeywordConfig] as string[];
  if (categoryData.length > 0) {
    emptyMessage.classList.add('hidden');
  }

  categoryData.forEach((keyword) => renderChip(keyword, chipsBox, { category, emptyMessage }));

  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;

    const introducedKeywords = (input.value as string).trim().split(',').map(k => k.trim());
    if (introducedKeywords.length === 0) return;

    const currentValues = await getKeywordsFromStorage();
    const categoryArray = currentValues[category as keyof KeywordConfig] as string[];

    introducedKeywords.forEach((introducedKeyword) => {
      if (categoryArray.includes(introducedKeyword)) return;
      categoryArray.push(introducedKeyword);
      renderChip(introducedKeyword, chipsBox, { category, emptyMessage });
    });

    emptyMessage.classList.add('hidden');
    input.value = '';
    await chrome.storage.sync.set({ keywords: currentValues });
    configChanged();
  });

  setupDropzone(card, category);
}

function setupDropzone(card: HTMLElement, targetCategory: string) {
  const dropzone = card.querySelector<HTMLElement>(`.chips-box[data-dropzone="${targetCategory}"]`);
  if (!dropzone) return;

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  };

  const handleDragLeave = () => {
    dropzone.classList.remove('drag-over');
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');

    const data = e.dataTransfer?.getData('text/plain');
    if (!data) return;

    const { keyword, sourceCategory } = JSON.parse(data);
    if (sourceCategory === targetCategory) return;

    const currentValues = await getKeywordsFromStorage();
    const sourceArray = currentValues[sourceCategory as keyof KeywordConfig] as string[];
    const targetArray = currentValues[targetCategory as keyof KeywordConfig] as string[];

    const index = sourceArray.indexOf(keyword);
    if (index === -1) return;

    sourceArray.splice(index, 1);
    targetArray.push(keyword);

    await chrome.storage.sync.set({ keywords: currentValues });

    const sourceChipsBox = card.querySelector<HTMLElement>(`.chips-box[data-dropzone="${sourceCategory}"]`);
    const sourceEmptyMessage = sourceChipsBox?.querySelector<HTMLElement>('.empty-message');
    const targetChipsBox = card.querySelector<HTMLElement>(`.chips-box[data-dropzone="${targetCategory}"]`);
    const targetEmptyMessage = targetChipsBox?.querySelector<HTMLElement>('.empty-message');

    if (sourceChipsBox?.parentElement && targetChipsBox?.parentElement) {
      sourceChipsBox.parentElement.style.maxHeight = sourceChipsBox.parentElement.scrollHeight + 20 + 'px';
      targetChipsBox.parentElement.style.maxHeight = targetChipsBox.parentElement.scrollHeight + 20 + 'px';
    }


    const chipElement = document.querySelector(`.chip[data-keyword="${keyword}"][data-category="${sourceCategory}"]`);
    if (chipElement) {
      chipElement.remove();
    }

    if (sourceArray.length === 0 && sourceEmptyMessage) {
      sourceEmptyMessage.classList.remove('hidden');
    }

    renderChip(keyword, targetChipsBox!, { category: targetCategory, emptyMessage: targetEmptyMessage! });
    if (targetArray.length > 0 && targetEmptyMessage) {
      targetEmptyMessage.classList.add('hidden');
    }

    configChanged();
  };

  dropzone.addEventListener('dragover', handleDragOver);
  dropzone.addEventListener('dragleave', handleDragLeave);
  dropzone.addEventListener('drop', handleDrop);

  dropzone.querySelectorAll('.chip').forEach((chip) => {
    const htmlChip = chip as HTMLElement;
    htmlChip.addEventListener('dragover', handleDragOver);
    htmlChip.addEventListener('dragleave', handleDragLeave);
    htmlChip.addEventListener('drop', handleDrop);
  });
}

function renderChip(
  keyword: string,
  chipsBox: HTMLElement,
  options?: {
    category?: string;
    dataKey?: string;
    emptyMessage?: HTMLElement;
  }
) {
  const chip = document.createElement('div');
  chip.className = 'chip';

  if (options?.category) {
    chip.draggable = true;
    chip.dataset.keyword = keyword;
    chip.dataset.category = options.category;
  }

  chip.innerHTML = `
    <span>${keyword}</span>
    <button type="button" class="remove-chip">&times;</button>
  `;

  if (options?.category) {
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/plain', JSON.stringify({ keyword, sourceCategory: options.category }));
      chip.classList.add('dragging');
    });

    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging');
    });
  }

  chip.querySelector('.remove-chip')?.addEventListener('click', async () => {
    if (options?.category) {
      const currentValues = await getKeywordsFromStorage();
      const categoryArray = currentValues[options.category as keyof KeywordConfig] as string[];

      const index = categoryArray.indexOf(keyword);
      if (index === -1) return;

      categoryArray.splice(index, 1);
      await chrome.storage.sync.set({ keywords: currentValues });

      chip.remove();

      if (categoryArray.length === 0 && options.emptyMessage) {
        options.emptyMessage.classList.remove('hidden');
      }

      configChanged();
    } else if (options?.dataKey) {
      const values = await getValueFromStorage(options.dataKey);

      const index = values.data.findIndex((item: string) => item === keyword);
      if (index !== -1) {
        values.data.splice(index, 1);
      }

      await chrome.storage.sync.set({ [options.dataKey]: values });

      chip.remove();

      if (values.data.length === 0 && options.emptyMessage) {
        options.emptyMessage.classList.remove('hidden');
      }

      configChanged();
    }
  });

  chipsBox.appendChild(chip);
}

async function getKeywordsFromStorage(): Promise<KeywordConfig> {
  const values = await chrome.storage.sync.get(['keywords']) as { keywords: KeywordConfig };

  if (values.keywords && Array.isArray((values.keywords as any).data)) {
    const oldKeywords = values.keywords as any;
    return {
      enabled: oldKeywords.enabled,
      anywhere: [...oldKeywords.data],
      title: [],
      description: [],
    };
  }

  if (values.keywords?.anywhere) {
    return values.keywords;
  }

  return {
    enabled: false,
    anywhere: [],
    title: [],
    description: [],
  };
}

async function setupLocations() {
  const card = document.querySelector<HTMLElement>('.feature-card[data-name="locations"]');
  if (!card) return;

  const dataKey = 'locations';
  const toggle = card.querySelector<HTMLInputElement>('.toggle-trigger');
  const content = card.querySelector<HTMLElement>('.card-content');
  const input = card.querySelector<HTMLInputElement>('.chip-input');
  const chipsBox = card.querySelector<HTMLElement>('.chips-box');
  const emptyMessage = card.querySelector<HTMLElement>('.empty-message');
  const modeBtns = card.querySelectorAll<HTMLButtonElement>('.mode-btn');

  if (!toggle || !content || !input || !chipsBox || !emptyMessage) return;

  const config = await getLocationsFromStorage();

  if (config.enabled) {
    content.classList.remove('hidden');
    toggle.checked = true;
  }

  modeBtns.forEach((btn) => {
    const mode = btn.dataset.mode;
    if (mode === config.mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.addEventListener('click', async () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const currentConfig = await getLocationsFromStorage();
      currentConfig.mode = (btn.dataset.mode as 'whitelist' | 'blacklist') || 'blacklist';
      await chrome.storage.sync.set({ [dataKey]: currentConfig });
      configChanged();
    });
  });

  if (config.data.length > 0) {
    emptyMessage.classList.add('hidden');
  }

  config.data.forEach((keyword: string) => renderChip(keyword, chipsBox, { dataKey, emptyMessage }));

  toggle.addEventListener('change', async () => {
    const currentConfig = await getLocationsFromStorage();
    currentConfig.enabled = toggle.checked;

    await chrome.storage.sync.set({ [dataKey]: currentConfig });

    if (currentConfig.enabled) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }

    configChanged();
  });

  input.addEventListener('keydown', async (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return;

    const introducedKeywords = input.value.trim().split(',').map(key => key.trim());
    if (introducedKeywords.length === 0) return;

    const currentConfig = await getLocationsFromStorage();

    introducedKeywords.forEach((introducedKeyword) => {
      if (currentConfig.data.includes(introducedKeyword)) return;
      currentConfig.data.push(introducedKeyword);
      renderChip(introducedKeyword, chipsBox, { dataKey, emptyMessage });
    });

    emptyMessage.classList.add('hidden');
    input.value = '';

    await chrome.storage.sync.set({ [dataKey]: currentConfig });
    configChanged();
  });
}

async function getLocationsFromStorage(): Promise<LocationConfig> {
  const values = await chrome.storage.sync.get(['locations']) as { locations?: any };
  if (values.locations) {
    return {
      enabled: values.locations.enabled ?? false,
      mode: values.locations.mode ?? 'blacklist',
      data: Array.isArray(values.locations.data) ? values.locations.data : [],
    };
  }
  return {
    enabled: false,
    mode: 'blacklist',
    data: [],
  };
}

async function setupWorkplaceTypes() {
  const card = document.querySelector<HTMLElement>('.feature-card[data-name="workplaceTypes"]');
  if (!card) return;

  const dataKey = 'workplaceTypes';
  const toggle = card.querySelector<HTMLInputElement>('.toggle-trigger');
  const content = card.querySelector<HTMLElement>('.card-content');
  const checkboxes = card.querySelectorAll<HTMLInputElement>('.workplace-type-checkbox');

  if (!toggle || !content) return;

  const config = await getWorkplaceTypesFromStorage();

  if (config.enabled) {
    content.classList.remove('hidden');
    toggle.checked = true;
  }

  checkboxes.forEach((cb) => {
    cb.checked = config.types.includes(cb.value as any);

    cb.addEventListener('change', async () => {
      const selectedTypes: ('remote' | 'hybrid' | 'on-site')[] = [];
      checkboxes.forEach((c) => {
        if (c.checked) {
          selectedTypes.push(c.value as any);
        }
      });

      const currentConfig = await getWorkplaceTypesFromStorage();
      currentConfig.types = selectedTypes;

      await chrome.storage.sync.set({ [dataKey]: currentConfig });
      configChanged();
    });
  });

  toggle.addEventListener('change', async () => {
    const currentConfig = await getWorkplaceTypesFromStorage();
    currentConfig.enabled = toggle.checked;

    await chrome.storage.sync.set({ [dataKey]: currentConfig });

    if (currentConfig.enabled) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }

    configChanged();
  });
}

async function getWorkplaceTypesFromStorage(): Promise<WorkplaceTypeConfig> {
  const values = await chrome.storage.sync.get(['workplaceTypes']) as { workplaceTypes?: any };
  if (values.workplaceTypes) {
    return {
      enabled: values.workplaceTypes.enabled ?? false,
      types: Array.isArray(values.workplaceTypes.types) ? values.workplaceTypes.types : ['remote', 'hybrid', 'on-site'],
    };
  }
  return {
    enabled: false,
    types: ['remote', 'hybrid', 'on-site'],
  };
}

async function setupAutoAdvance() {
  const card = document.querySelector<HTMLElement>('.feature-card[data-name="autoAdvance"]');
  if (!card) return;

  const dataKey = 'autoAdvance';
  const toggle = card.querySelector<HTMLInputElement>('.toggle-trigger');
  const content = card.querySelector<HTMLElement>('.card-content');
  const delayInput = card.querySelector<HTMLInputElement>('.delay-input');

  if (!toggle || !content || !delayInput) return;

  const config = await getAutoAdvanceFromStorage();

  if (config.enabled) {
    content.classList.remove('hidden');
    toggle.checked = true;
  }

  delayInput.value = String(config.delay);

  toggle.addEventListener('change', async () => {
    const currentConfig = await getAutoAdvanceFromStorage();
    currentConfig.enabled = toggle.checked;

    await chrome.storage.sync.set({ [dataKey]: currentConfig });

    if (currentConfig.enabled) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }

    configChanged();
  });

  delayInput.addEventListener('change', async () => {
    const currentConfig = await getAutoAdvanceFromStorage();
    currentConfig.delay = parseInt(delayInput.value, 10) || 500;

    await chrome.storage.sync.set({ [dataKey]: currentConfig });
    configChanged();
  });
}

async function getAutoAdvanceFromStorage() {
  const values = await chrome.storage.sync.get(['autoAdvance']) as { autoAdvance: any };
  if (values.autoAdvance) return values.autoAdvance;

  return {
    enabled: false,
    delay: 500,
  };
}

function setupOtherCards(dataKeys: string[]) {
  dataKeys.forEach(async (dataKey) => {
    const card = document.querySelector<HTMLElement>(`.feature-card[data-name="${dataKey}"]`);

    if (!card) return;

    const toggle = card.querySelector<HTMLInputElement>('.toggle-trigger');
    const content = card.querySelector<HTMLElement>('.card-content');
    const input = card.querySelector<HTMLInputElement>('.chip-input');
    const chipsBox = card.querySelector<HTMLElement>('.chips-box');
    const emptyMessage = card.querySelector<HTMLElement>('.empty-message');

    if (!toggle || !content || !input || !chipsBox || !emptyMessage) {
      return;
    }

    const values = await getValueFromStorage(dataKey);

    if (values.enabled) {
      content.classList.remove('hidden');
      toggle.checked = true;
    }

    if (values.data.length > 0) {
      emptyMessage.classList.add('hidden');
    }

    values.data.forEach((keyword: string) => renderChip(keyword, chipsBox, { dataKey, emptyMessage }));

    toggle.addEventListener('change', toggleField.bind(null, dataKey, content));

    input.addEventListener('keydown', inputChange.bind(null, dataKey, chipsBox, emptyMessage));
  });
}

async function getValueFromStorage(dataKey: string): Promise<{ enabled: boolean; data: string[] }> {
  const values = await chrome.storage.sync.get([dataKey]) as { [key: string]: { enabled: boolean; data: string[] } };
  if (values[dataKey]) return values[dataKey];

  return {
    enabled: false,
    data: [],
  };
}

async function toggleField(dataKey: string, content: HTMLElement) {
  const values = await getValueFromStorage(dataKey);
  values.enabled = !values.enabled;

  await chrome.storage.sync.set({ [dataKey]: values });

  if (values.enabled) {
    content.classList.remove('hidden');
  } else {
      content.classList.add('hidden');
  }

  configChanged();
}

async function inputChange(dataKey: string, chipsBox: HTMLElement, emptyMessage: HTMLElement, e: KeyboardEvent) {
  if (e.key !== 'Enter') return;

  const input = e.target as HTMLInputElement;
  const introducedKeywords = input.value.trim().split(',').map(key => key.trim());

  if (introducedKeywords.length === 0) return;

  const values = await getValueFromStorage(dataKey);

  introducedKeywords.forEach((introducedKeyword) => {
    if (values.data.findIndex((keyword: string) => keyword === introducedKeyword) >= 0) {
      return;
    }

    values.data.push(introducedKeyword);
    renderChip(introducedKeyword, chipsBox, { dataKey, emptyMessage });
  });

  emptyMessage.classList.add('hidden');
  input.value = '';

  await chrome.storage.sync.set({ [dataKey]: values });
  configChanged();
}

async function configChanged(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: CONFIG_UPDATED });
  }
};

