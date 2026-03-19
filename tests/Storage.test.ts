import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Storage } from '../src/Storage';
import { ConfigMother } from './mothers/ConfigMother';

vi.stubGlobal('chrome', {
  storage: {
    sync: {
      get: vi.fn<() => Promise<Record<string, unknown>>>(),
      set: vi.fn(),
    },
    local: {
      get: vi.fn<() => Promise<Record<string, unknown>>>(),
      set: vi.fn(),
    },
  },
});

describe('Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should return default config when nothing is stored (Chrome always returns an empty object when nothing was stored)', async () => {
      vi.mocked(chrome.storage.sync.get).mockResolvedValue({});
      vi.mocked(chrome.storage.local.get).mockResolvedValue({});

      const storage = new Storage();
      const config = await storage.get();

      expect(config).toEqual(ConfigMother.create().build());
    });

    it('should return stored config', async () => {
      const config = ConfigMother.create()
        .withKeywords({ enabled: true, anywhere: ['senior'], title: [], description: [] })
        .withCompanies({ enabled: true, data: ['google'] })
        .withWhitelist({ enabled: true, data: ['meta'] })
        .withHiddenJobs({ enabled: true, data: ['job-1', 'job-2'] })
        .withAutoAdvance({ enabled: true, delay: 1000 })
        .build();

      vi.mocked(chrome.storage.sync.get).mockResolvedValue({
        keywords: config.keywords,
        companies: config.companies,
        whitelist: config.whitelist,
        autoAdvance: config.autoAdvance,
      });
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        hiddenJobs: config.hiddenJobs,
      });

      const storage = new Storage();
      const result = await storage.get();

      expect(result).toEqual(config);
    });

    it('should return stored config with legacy keywords format', async () => {
      const legacyKeywords = {
        enabled: true,
        data: ['senior', 'lead'],
      };

      vi.mocked(chrome.storage.sync.get).mockResolvedValue({
        keywords: legacyKeywords,
      });
      vi.mocked(chrome.storage.local.get).mockResolvedValue({});

      const storage = new Storage();
      const config = await storage.get();

      expect(config).toEqual(ConfigMother.create()
        .withKeywords({
          enabled: true,
          anywhere: ['senior', 'lead'],
          title: [],
          description: [],
        })
        .build());
    });
  });

  describe('setHiddenJobs', () => {
    it('should set hidden jobs in local storage', async () => {
      const storage = new Storage();
      await storage.setHiddenJobs(['job-1', 'job-2']);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        hiddenJobs: { enabled: true, data: ['job-1', 'job-2'] },
      });
    });
  });
});
