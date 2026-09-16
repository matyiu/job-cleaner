import { DOMObserver } from "./DOMObserver";
import { CONFIG_UPDATED } from "./events";
import type { Job } from "./Job";
import { JobParser } from "./JobParser";
import { JobState } from "./JobState";
import { Storage } from "./Storage";
import { AdvanceEvent, AutoAdvancer } from "./AutoAdvancer";
import { HideJob } from "./HideJob";
import { OnAppliedJob } from "./OnAppliedJob";

const jobParser = new JobParser();
const storage = new Storage();
const jobState = new JobState();
const hideJob = new HideJob(storage);
const autoAdvancer = new AutoAdvancer(storage);
const onAppliedJob = new OnAppliedJob(jobState, autoAdvancer, hideJob);
const domObserver = new DOMObserver(jobParser, jobState, onAppliedJob);

domObserver.init(handleJobFilter);

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === CONFIG_UPDATED) {
    handleJobFilter();
  }
})

async function handleJobFilter() {
  const config = await storage.get();

  const jobs = jobState.get();
  if (jobs.length === 0) {
    return;
  }

  const currentJobId = new URLSearchParams(window.location.search).get('currentJobId');

  jobs.forEach((job: Job) => {
    job.onDismiss(() => {
      hideJob.execute(job);
    });

    if (job.isApplied() || job.shouldHide(config)) {
      job.hide();
    } else {
      job.show();
    }
  });

  const visibleJobs = jobs.filter(job => !job.isHidden());

  if (visibleJobs.length === 0) {
    autoAdvancer.advance(undefined, AdvanceEvent.FILTER_HIDDEN);
    return;
  }

  if (currentJobId) {
    const currentJob = jobs.find(j => j.id === currentJobId);
    if (currentJob && currentJob.isHidden()) {
      const currentJobIndex = jobs.findIndex(j => j.id === currentJobId);
      const nextVisibleJob = jobs.slice(currentJobIndex + 1).find(j => !j.isHidden()) || visibleJobs[0];
      autoAdvancer.advance(nextVisibleJob, AdvanceEvent.FILTER_HIDDEN);
    }
  }
}
