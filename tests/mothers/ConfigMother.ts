import type { Config } from '../../src/Config';

export class ConfigMother {
  private keywords: Config['keywords'];
  private companies: Config['companies'];
  private whitelist: Config['whitelist'];
  private hiddenJobs: Config['hiddenJobs'];
  private autoAdvance: Config['autoAdvance'];

  static create(): ConfigMother {
    return new ConfigMother();
  }

  private constructor() {
    this.keywords = { enabled: false, anywhere: [], title: [], description: [] };
    this.companies = { enabled: false, data: [] };
    this.whitelist = { enabled: false, data: [] };
    this.hiddenJobs = { enabled: false, data: [] };
    this.autoAdvance = { enabled: false, delay: 500 };
  }

  withKeywords(keywords: Config['keywords']): ConfigMother {
    this.keywords = keywords;
    return this;
  }

  withCompanies(companies: Config['companies']): ConfigMother {
    this.companies = companies;
    return this;
  }

  withWhitelist(whitelist: Config['whitelist']): ConfigMother {
    this.whitelist = whitelist;
    return this;
  }

  withHiddenJobs(hiddenJobs: Config['hiddenJobs']): ConfigMother {
    this.hiddenJobs = hiddenJobs;
    return this;
  }

  withAutoAdvance(autoAdvance: Config['autoAdvance']): ConfigMother {
    this.autoAdvance = autoAdvance;
    return this;
  }

  build(): Config {
    return {
      keywords: this.keywords,
      companies: this.companies,
      whitelist: this.whitelist,
      hiddenJobs: this.hiddenJobs,
      autoAdvance: this.autoAdvance,
    };
  }
}
