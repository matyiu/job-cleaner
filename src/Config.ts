export type FieldValues = {
  enabled: boolean;
  data: string[];
}

export type AutoAdvanceConfig = {
  enabled: boolean;
  delay: number;
}

export type Config = {
  keywords: FieldValues;
  companies: FieldValues;
  whitelist: FieldValues;
  hiddenJobs: FieldValues;
  autoAdvance: AutoAdvanceConfig;
}

export const CONFIG_KEYS = ['keywords', 'companies', 'whitelist', 'hiddenJobs', 'autoAdvance'];
