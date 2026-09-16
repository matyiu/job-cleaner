export type FieldValues = {
  enabled: boolean;
  data: string[];
}

export type KeywordConfig = {
  enabled: boolean;
  anywhere: string[];
  title: string[];
  description: string[];
}

export type LocationConfig = {
  enabled: boolean;
  mode: 'whitelist' | 'blacklist';
  data: string[];
}

export type WorkplaceType = 'remote' | 'hybrid' | 'on-site';

export type WorkplaceTypeConfig = {
  enabled: boolean;
  types: WorkplaceType[];
}

export type AutoAdvanceConfig = {
  enabled: boolean;
  delay: number;
}

export type Config = {
  keywords: KeywordConfig;
  companies: FieldValues;
  whitelist: FieldValues;
  locations: LocationConfig;
  workplaceTypes: WorkplaceTypeConfig;
  hiddenJobs: FieldValues;
  autoAdvance: AutoAdvanceConfig;
}

export const CONFIG_KEYS = ['keywords', 'companies', 'whitelist', 'locations', 'workplaceTypes', 'hiddenJobs', 'autoAdvance'];

