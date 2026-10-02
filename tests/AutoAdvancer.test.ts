import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoAdvancer, AdvanceEvent } from '../src/AutoAdvancer';
import { Storage } from '../src/Storage';
import { JobMother } from './mothers/JobMother';

vi.stubGlobal('chrome', {
  storage: {
    sync: {
      get: vi.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue({}),
      set: vi.fn(),
    },
    local: {
      get: vi.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue({}),
      set: vi.fn(),
    },
  },
});

describe('AutoAdvancer', () => {
  let storage: Storage;
  let autoAdvancer: AutoAdvancer;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chrome.storage.sync.get).mockResolvedValue({});
    vi.mocked(chrome.storage.local.get).mockResolvedValue({});
    storage = new Storage();
    autoAdvancer = new AutoAdvancer(storage);
    document.body.innerHTML = '';
  });

  describe('findNextButton', () => {
    it('should find next button using user-provided data-testid HTML snippet', () => {
      document.body.innerHTML = `
        <div class="_7e067ac6">
          <button type="button" data-testid="pagination-controls-prev-button-visible">
            <span>Anterior</span>
          </button>
          <ul data-testid="pagination-controls-list">
            <li><button aria-label="Página 2" aria-current="false" type="button" data-testid="pagination-indicator-1"><span>2</span></button></li>
            <li><button aria-label="Página 3" aria-current="true" type="button" data-testid="pagination-indicator-2"><span>3</span></button></li>
            <li><button aria-label="Página 4" aria-current="false" type="button" data-testid="pagination-indicator-3"><span>4</span></button></li>
          </ul>
          <button type="button" data-testid="pagination-controls-next-button-visible">
            <span>
              <svg id="chevron-right-small"><path d="m5 15 4.61-7L5 1h2.39L12 8l-4.61 7z"></path></svg>
              <span>Siguiente</span>
            </span>
          </button>
        </div>
      `;

      const nextButton = autoAdvancer.findNextButton();
      expect(nextButton).not.toBeNull();
      expect(nextButton?.getAttribute('data-testid')).toBe('pagination-controls-next-button-visible');
    });

    it('should find next button using legacy class name', () => {
      document.body.innerHTML = `
        <button class="jobs-search-pagination__button jobs-search-pagination__button--next">Next</button>
      `;

      const nextButton = autoAdvancer.findNextButton();
      expect(nextButton).not.toBeNull();
      expect(nextButton?.classList.contains('jobs-search-pagination__button--next')).toBe(true);
    });

    it('should find next button using aria-label', () => {
      document.body.innerHTML = `
        <button aria-label="Página siguiente">></button>
      `;

      const nextButton = autoAdvancer.findNextButton();
      expect(nextButton).not.toBeNull();
      expect(nextButton?.getAttribute('aria-label')).toBe('Página siguiente');
    });

    it('should find next button via SVG chevron icon', () => {
      document.body.innerHTML = `
        <button type="button" id="custom-next-btn">
          <svg id="chevron-right-small"></svg>
        </button>
      `;

      const nextButton = autoAdvancer.findNextButton();
      expect(nextButton).not.toBeNull();
      expect(nextButton?.id).toBe('custom-next-btn');
    });

    it('should find next button via text content "Siguiente"', () => {
      document.body.innerHTML = `
        <button type="button" id="text-next-btn">Siguiente</button>
      `;

      const nextButton = autoAdvancer.findNextButton();
      expect(nextButton).not.toBeNull();
      expect(nextButton?.id).toBe('text-next-btn');
    });

    it('should find next button via active pagination indicator next sibling', () => {
      document.body.innerHTML = `
        <ul>
          <li><button aria-current="false">1</button></li>
          <li><button aria-current="true">2</button></li>
          <li><button id="page-3-btn" aria-current="false">3</button></li>
        </ul>
      `;

      const nextButton = autoAdvancer.findNextButton();
      expect(nextButton).not.toBeNull();
      expect(nextButton?.id).toBe('page-3-btn');
    });

    it('should ignore disabled next buttons', () => {
      document.body.innerHTML = `
        <button type="button" data-testid="pagination-controls-next-button-visible" disabled>Siguiente</button>
      `;

      const nextButton = autoAdvancer.findNextButton();
      expect(nextButton).toBeNull();
    });
  });

  describe('advance', () => {
    it('should select nextJob if provided', async () => {
      vi.useFakeTimers();
      vi.mocked(chrome.storage.sync.get).mockResolvedValueOnce({
        autoAdvance: { enabled: true, delay: 500 }
      });
      const job = JobMother.create().build();
      const selectSpy = vi.spyOn(job, 'select');

      await autoAdvancer.advance(job, AdvanceEvent.FILTER_HIDDEN);
      vi.runAllTimers();

      expect(selectSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should click next button if nextJob is undefined', async () => {
      vi.useFakeTimers();
      vi.mocked(chrome.storage.sync.get).mockResolvedValueOnce({
        autoAdvance: { enabled: true, delay: 500 }
      });
      document.body.innerHTML = `
        <button type="button" data-testid="pagination-controls-next-button-visible">Siguiente</button>
      `;

      const button = document.querySelector('button') as HTMLButtonElement;
      let clicked = false;
      button.addEventListener('click', () => { clicked = true; });

      await autoAdvancer.advance(undefined, AdvanceEvent.FILTER_HIDDEN);
      vi.runAllTimers();

      expect(clicked).toBe(true);
      vi.useRealTimers();
    });

    it('should not advance on APPLIED event if autoAdvance is disabled in storage', async () => {
      vi.useFakeTimers();
      document.body.innerHTML = `
        <button type="button" data-testid="pagination-controls-next-button-visible">Siguiente</button>
      `;

      vi.mocked(chrome.storage.sync.get).mockResolvedValueOnce({
        autoAdvance: { enabled: false, delay: 500 }
      });

      const button = document.querySelector('button') as HTMLButtonElement;
      let clicked = false;
      button.addEventListener('click', () => { clicked = true; });

      await autoAdvancer.advance(undefined, AdvanceEvent.APPLIED);
      vi.runAllTimers();

      expect(clicked).toBe(false);
      vi.useRealTimers();
    });

    it('should not advance on FILTER_HIDDEN event if autoAdvance is disabled in storage', async () => {
      vi.useFakeTimers();
      document.body.innerHTML = `
        <button type="button" data-testid="pagination-controls-next-button-visible">Siguiente</button>
      `;

      vi.mocked(chrome.storage.sync.get).mockResolvedValueOnce({
        autoAdvance: { enabled: false, delay: 500 }
      });

      const button = document.querySelector('button') as HTMLButtonElement;
      let clicked = false;
      button.addEventListener('click', () => { clicked = true; });

      await autoAdvancer.advance(undefined, AdvanceEvent.FILTER_HIDDEN);
      vi.runAllTimers();

      expect(clicked).toBe(false);
      vi.useRealTimers();
    });
  });
});
