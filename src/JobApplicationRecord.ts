export interface JobApplicationData {
  id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  appliedAt: string;
  status?: string;
  notes?: string;
  tags?: string[];
}

export class JobApplicationRecord {
  public readonly id: string;
  public readonly title: string;
  public readonly company: string;
  public readonly location: string;
  public readonly description: string;
  public readonly appliedAt: string;
  public readonly status: string;
  public readonly notes: string;
  public readonly tags: string[];

  constructor(data: JobApplicationData) {
    this.id = data.id;
    this.title = data.title;
    this.company = data.company;
    this.location = data.location ?? '';
    this.description = data.description ?? '';
    this.appliedAt = data.appliedAt || new Date().toISOString();
    this.status = data.status ?? 'applied';
    this.notes = data.notes ?? '';
    this.tags = data.tags ?? [];
  }

  public getDayKey(): string {
    const date = new Date(this.appliedAt);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public isToday(): boolean {
    const todayStr = new Date();
    const year = todayStr.getFullYear();
    const month = String(todayStr.getMonth() + 1).padStart(2, '0');
    const day = String(todayStr.getDate()).padStart(2, '0');
    return this.getDayKey() === `${year}-${month}-${day}`;
  }

  public toJSON(): JobApplicationData {
    return {
      id: this.id,
      title: this.title,
      company: this.company,
      location: this.location,
      description: this.description,
      appliedAt: this.appliedAt,
      status: this.status,
      notes: this.notes,
      tags: this.tags,
    };
  }

  public static fromJSON(json: JobApplicationData): JobApplicationRecord {
    return new JobApplicationRecord(json);
  }
}
