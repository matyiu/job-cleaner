import { CONFIG_KEYS, type Config } from "./Config";

export class Storage {
  public async get(): Promise<Config> {
    const storedConfig = await chrome.storage.sync.get(['keywords', 'companies', 'whitelist']);
    storedConfig.hiddenJobs = await chrome.storage.local.get(['hiddenJobs']).then(res => res.hiddenJobs);

    const config: Partial<Config> = {};

    CONFIG_KEYS.forEach(key => {
      const storedValue = storedConfig[key] ?? {};

      config[key as keyof Config] = {
        enabled: false,
        data: [],
        ...storedValue
      }
    });

    return config as Config;
  }
}
