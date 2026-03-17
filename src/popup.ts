import type { KeywordConfig } from "./Config";
import { CONFIG_UPDATED } from "./events";

document.addEventListener('DOMContentLoaded', () => {
  setupKeywords();
  setupAutoAdvance();
  setupOtherCards(['companies', 'whitelist']);
});

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

      values.data.splice(values.data.findIndex(item => item === keyword), 1);

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
    if (values.data.findIndex(keyword => keyword === introducedKeyword) >= 0) {
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
