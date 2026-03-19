import { Job } from '../../src/Job';

export class JobMother {
  private id: string;
  private title: string;
  private company: string;
  private description?: string;
  private post: HTMLElement;
  private button: HTMLElement;

  static create(): JobMother {
    return new JobMother();
  }

  private constructor() {
    this.id = 'test-job-id';
    this.title = 'Software Engineer';
    this.company = 'Tech Corp';
    this.post = document.createElement('li');
    this.button = document.createElement('a');
    this.setupPost();
  }

  private setupPost(): void {
    this.post.style.display = '';
    this.post.dataset['occludableJobId'] = this.id;
    this.button.dataset['jobId'] = this.id;
    this.post.appendChild(this.button);
    document.body.appendChild(this.post);
  }

  withId(id: string): JobMother {
    this.id = id;
    this.post.dataset['occludableJobId'] = id;
    this.button.dataset['jobId'] = id;
    return this;
  }

  withTitle(title: string): JobMother {
    this.title = title;
    return this;
  }

  withCompany(company: string): JobMother {
    this.company = company;
    return this;
  }

  withDescription(description: string): JobMother {
    this.description = description;
    return this;
  }

  build(): Job {
    const job = new Job(this.id, this.title, this.company, this.post);
    if (this.description) {
      job.updateDescription(this.description);
    }
    return job;
  }
}
