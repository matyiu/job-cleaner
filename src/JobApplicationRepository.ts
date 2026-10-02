import { JobApplicationRecord, type JobApplicationData } from "./JobApplicationRecord";

export class JobApplicationRepository {
  private readonly STORAGE_KEY = 'appliedJobs';

  public async getAll(): Promise<JobApplicationRecord[]> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return [];
    }
    const result = await chrome.storage.local.get([this.STORAGE_KEY]);
    const rawList: JobApplicationData[] = result[this.STORAGE_KEY] || [];
    return rawList.map(data => JobApplicationRecord.fromJSON(data));
  }

  public async add(record: JobApplicationRecord): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return;
    }
    const current = await this.getAll();
    const existingIndex = current.findIndex(r => r.id === record.id);

    if (existingIndex >= 0) {
      const existing = current[existingIndex];
      const updatedRecord = new JobApplicationRecord({
        id: record.id,
        title: existing.title || record.title,
        company: existing.company || record.company,
        location: existing.location || record.location,
        description: existing.description || record.description,
        appliedAt: existing.appliedAt || record.appliedAt,
        status: existing.status || record.status,
        notes: existing.notes || record.notes,
        tags: existing.tags && existing.tags.length > 0 ? existing.tags : record.tags,
      });
      current[existingIndex] = updatedRecord;
    } else {
      current.push(record);
    }

    await chrome.storage.local.set({
      [this.STORAGE_KEY]: current.map(r => r.toJSON())
    });
  }

  public async clear(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return;
    }
    await chrome.storage.local.set({ [this.STORAGE_KEY]: [] });
  }
}
