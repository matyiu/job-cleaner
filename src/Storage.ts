import { CONFIG_KEYS, type Config, type FieldValues, type KeywordConfig, type LocationConfig, type WorkplaceTypeConfig } from "./Config";

export class Storage {
  public async get(): Promise<Config> {
    const storedConfig = await chrome.storage.sync.get(['keywords', 'companies', 'whitelist', 'locations', 'workplaceTypes', 'autoAdvance']);
    storedConfig.hiddenJobs = await chrome.storage.local.get(['hiddenJobs']).then(res => res.hiddenJobs);

    const config: Config = {
      keywords: { enabled: false, anywhere: [], title: [], description: [] },
      companies: { enabled: false, data: [] },
      whitelist: { enabled: false, data: [] },
      locations: { enabled: false, mode: 'blacklist', data: [] },
      workplaceTypes: { enabled: false, types: ['remote', 'hybrid', 'on-site'] },
      hiddenJobs: { enabled: false, data: [] },
      autoAdvance: { enabled: false, delay: 500 },
    };

    if (storedConfig.keywords) {
      const oldKeywords = storedConfig.keywords as any;
      if (Array.isArray(oldKeywords.data)) {
        config.keywords = {
          enabled: oldKeywords.enabled ?? false,
          anywhere: [...oldKeywords.data],
          title: [],
          description: [],
        };
      } else if (oldKeywords.anywhere) {
        config.keywords = { ...config.keywords, ...oldKeywords } as KeywordConfig;
      }
    }
    if (storedConfig.companies) {
      config.companies = { ...config.companies, ...storedConfig.companies } as FieldValues;
    }
    if (storedConfig.whitelist) {
      config.whitelist = { ...config.whitelist, ...storedConfig.whitelist } as FieldValues;
    }
    if (storedConfig.locations) {
      config.locations = { ...config.locations, ...storedConfig.locations } as LocationConfig;
    }
    if (storedConfig.workplaceTypes) {
      config.workplaceTypes = { ...config.workplaceTypes, ...storedConfig.workplaceTypes } as WorkplaceTypeConfig;
    }
    if (storedConfig.hiddenJobs) {
      config.hiddenJobs = { ...config.hiddenJobs, ...storedConfig.hiddenJobs } as FieldValues;
    }
    if (storedConfig.autoAdvance) {
      config.autoAdvance = { ...config.autoAdvance, ...storedConfig.autoAdvance };
    }

    return config;
  }

  public async setHiddenJobs(data: string[]): Promise<void> {
    await chrome.storage.local.set({ hiddenJobs: { enabled: true, data } });
  }
}
