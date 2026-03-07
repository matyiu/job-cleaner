import { Job } from "./Job";

const JOB_POST_SELECTOR = "li[data-occludable-job-id]";
const JOB_POST_TITLE_SELECTOR = ".job-card-list__title--link strong";
const JOB_POST_COMPANY_SELECTOR = ".artdeco-entity-lockup__subtitle";
const JOB_DESCRIPTION_SELECTOR = "#job-details";
const JOB_DESCRIPTION_CONTAINER_SELECTOR = '.jobs-search__job-details--container';

export class JobParser {
  public parseList(jobListContainer: HTMLElement): Job[] {
    const jobPosts = Array.from(jobListContainer.querySelectorAll(JOB_POST_SELECTOR)) as HTMLElement[];
    const jobs: Job[] = [];

    jobPosts.forEach((jobPost) => {
      const id = jobPost.dataset.occludableJobId;
      const title = jobPost.querySelector(JOB_POST_TITLE_SELECTOR)?.textContent;
      const company = jobPost.querySelector(JOB_POST_COMPANY_SELECTOR)?.textContent;

      if (id && title && company) {
        jobs.push(
          new Job(id.trim(), title.trim(), company.trim(), jobPost)
        );
      }
    });

    return jobs;
  }

  public parseDescription(jobs: Job[], wrapper: HTMLElement): void {
    const jobDescription = wrapper.querySelector(JOB_DESCRIPTION_SELECTOR) as HTMLElement;
    const ariaLabel = wrapper.querySelector(JOB_DESCRIPTION_CONTAINER_SELECTOR)?.ariaLabel?.trim();

    jobs.forEach((job) => {
      if (job.title === ariaLabel) {
        job.updateDescription(jobDescription.textContent.trim());
      }
    })
  }
}
