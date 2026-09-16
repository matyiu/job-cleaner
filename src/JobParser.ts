import { Job } from "./Job";

const JOB_POST_SELECTOR = 'li[data-occludable-job-id], [componentkey^="job-card-component-ref-"][role="button"], [componentkey^="job-card-component-ref-"]';
const JOB_POST_TITLE_SELECTOR = ".job-card-list__title--link strong, .job-card-list__title--link";
const JOB_POST_COMPANY_SELECTOR = ".artdeco-entity-lockup__subtitle, .job-card-container__company-name";
const JOB_DESCRIPTION_SELECTOR = "#job-details, .jobs-search__job-details";
const JOB_DESCRIPTION_CONTAINER_SELECTOR = '.jobs-search__job-details--container';

export class JobParser {
  public parseList(jobListContainer: HTMLElement): Job[] {
    const rawElements = Array.from(jobListContainer.querySelectorAll(JOB_POST_SELECTOR)) as HTMLElement[];
    
    // Filter rawElements to keep outer top-level elements if nested elements match
    const jobPosts = rawElements.filter((el, index) => {
      return !rawElements.some((otherEl, otherIndex) => otherIndex !== index && otherEl.contains(el));
    });

    const jobs: Job[] = [];

    jobPosts.forEach((jobPost) => {
      const id = this.extractJobId(jobPost);
      const title = this.extractTitle(jobPost);
      const company = this.extractCompany(jobPost);

      if (id && title && company) {
        jobs.push(
          new Job(id.trim(), title.trim(), company.trim(), jobPost)
        );
      }
    });

    return jobs;
  }

  private extractJobId(jobPost: HTMLElement): string | null {
    if (jobPost.dataset.occludableJobId) {
      return jobPost.dataset.occludableJobId.trim();
    }

    const componentKey = jobPost.getAttribute('componentkey') || jobPost.dataset.componentkey;
    if (componentKey) {
      const match = componentKey.match(/job-card-component-ref-(\d+)/);
      if (match) return match[1];
    }

    const nestedKey = jobPost.querySelector('[componentkey*="job-card-component-ref-"]')?.getAttribute('componentkey');
    if (nestedKey) {
      const match = nestedKey.match(/job-card-component-ref-(\d+)/);
      if (match) return match[1];
    }

    return null;
  }

  private extractTitle(jobPost: HTMLElement): string | null {
    const dismissBtn = jobPost.querySelector('button[aria-label*="Descartar empleo"], button[aria-label*="Dismiss job"]');
    if (dismissBtn) {
      const label = dismissBtn.getAttribute('aria-label');
      const match = label?.match(/(?:Descartar empleo|Dismiss job)\s+[«"'](.*)[»"']/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    const oldTitle = jobPost.querySelector(JOB_POST_TITLE_SELECTOR)?.textContent;
    if (oldTitle?.trim()) {
      return oldTitle.trim();
    }

    const ariaHiddenSpan = jobPost.querySelector('p span[aria-hidden="true"]');
    if (ariaHiddenSpan) {
      const titleText = ariaHiddenSpan.childNodes[0]?.textContent || ariaHiddenSpan.textContent;
      if (titleText?.trim()) {
        return titleText.trim();
      }
    }

    const srSpan = jobPost.querySelector('._170ff3a8')?.textContent;
    if (srSpan?.trim()) {
      let clean = srSpan.trim();
      clean = clean.replace(/^(Seleccionado,\s*|Selected,\s*)/i, '');
      clean = clean.replace(/\s*\((empleo verificado|verified job)\)$/i, '');
      return clean.trim();
    }

    return null;
  }

  private extractCompany(jobPost: HTMLElement): string | null {
    const oldCompany = jobPost.querySelector(JOB_POST_COMPANY_SELECTOR)?.textContent;
    if (oldCompany?.trim()) {
      return oldCompany.trim();
    }

    const paragraphs = Array.from(jobPost.querySelectorAll('p'));
    if (paragraphs.length >= 2) {
      const companyText = paragraphs[1].textContent?.trim();
      if (companyText) {
        return companyText;
      }
    }

    return null;
  }

  public parseDescription(jobs: Job[], wrapper: HTMLElement): void {
    const jobDescription = wrapper.querySelector(JOB_DESCRIPTION_SELECTOR) as HTMLElement;
    const ariaLabel = wrapper.querySelector(JOB_DESCRIPTION_CONTAINER_SELECTOR)?.ariaLabel?.trim();

    if (!jobDescription || !jobDescription.textContent) return;

    jobs.forEach((job) => {
      if (job.title === ariaLabel) {
        job.updateDescription(jobDescription.textContent.trim());
      }
    });
  }
}
