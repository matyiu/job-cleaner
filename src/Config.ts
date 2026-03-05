export type FieldValues = {
  enabled: boolean;
  data: string[];
}


export type Config = {
  keywords: FieldValues;
  companies: FieldValues;
  whitelist: FieldValues;
  hiddenJobs: FieldValues;
}

export const CONFIG_KEYS = ['keywords', 'companies', 'whitelist', 'hiddenJobs'];
