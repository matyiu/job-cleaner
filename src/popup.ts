import type { FieldValues, AutoAdvanceConfig } from "./Config";
import { CONFIG_UPDATED } from "./events";

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll<HTMLElement>('.feature-card');

  cards.forEach(async (card) => {
    const dataKey = card.dataset.name;

    const toggle = card.querySelector<HTMLInputElement>('.toggle-trigger');
    const content = card.querySelector<HTMLElement>('.card-content');
    const input = card.querySelector<HTMLInputElement>('.chip-input');
    const chipsBox = card.querySelector<HTMLElement>('.chips-box');
    const emptyMessage = card.querySelector<HTMLElement>('.empty-message');

    if (!dataKey || !toggle || !content || !input || !chipsBox || !emptyMessage) {
      return;
    }

    const values: FieldValues = await getValueFromStorage(dataKey);

    if (values.enabled) {
      content.classList.remove('hidden');
      toggle.checked = true;
    }

    if (values.data.length > 0) {
      emptyMessage.classList.add('hidden');
    }

    values.data.forEach((keyword) => renderChip(dataKey, keyword, chipsBox))

    toggle.addEventListener('change', toggleField.bind(null, dataKey, content));

    input.addEventListener('keydown', inputChange.bind(null, dataKey, chipsBox));
  });

  setupAutoAdvance();
});

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

async function getAutoAdvanceFromStorage(): Promise<AutoAdvanceConfig> {
  const values = await chrome.storage.sync.get(['autoAdvance']) as { autoAdvance: AutoAdvanceConfig };
  if (values.autoAdvance) return values.autoAdvance;

  return {
    enabled: false,
    delay: 500,
  };
}

async function getValueFromStorage(dataKey: string): Promise<FieldValues> {
  const values = await chrome.storage.sync.get([dataKey]) as { [dataKey]: FieldValues };
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

async function inputChange(dataKey: string, chipsBox: HTMLElement, e: KeyboardEvent) {
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

    renderChip(dataKey, introducedKeyword, chipsBox);
  });

  chipsBox.children[0]?.classList.add('hidden');

  input.value = '';

  await chrome.storage.sync.set({ [dataKey]: values });
  configChanged();
}

function renderChip(dataKey: string, keyword: string, chipsBox: HTMLElement) {
  const chip = document.createElement('div');
  chip.className = 'chip';

  chip.innerHTML = `
        <span>${keyword}</span>
        <button type="button" class="remove-chip">&times;</button>
    `;

  chip.querySelector('.remove-chip')?.addEventListener('click', async () => {
    const values = await getValueFromStorage(dataKey);

    values.data.splice(values.data.findIndex(item => item === keyword), 1);

    await chrome.storage.sync.set({ [dataKey]: values });

    chip.remove();

    if (values.data.length === 0) {
      chipsBox.children[0]?.classList.remove('hidden');
    }

    configChanged();
  });

  chipsBox.appendChild(chip);
}

async function configChanged(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: CONFIG_UPDATED });
  }
};

