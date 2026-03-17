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

export type AutoAdvanceConfig = {
  enabled: boolean;
  delay: number;
}

export type Config = {
  keywords: KeywordConfig;
  companies: FieldValues;
  whitelist: FieldValues;
  hiddenJobs: FieldValues;
  autoAdvance: AutoAdvanceConfig;
}

export const CONFIG_KEYS = ['keywords', 'companies', 'whitelist', 'hiddenJobs', 'autoAdvance'];
