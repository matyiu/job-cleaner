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

  const currentJobId = new URLSearchParams(window.location.search).get('currentJobId');

  jobs.forEach((job: Job, index: number) => {
    job.onDismiss(() => {
      hideJob.execute(job);
    });

    if (job.isApplied()) {
      hideJob.execute(job);

      if (job.id === currentJobId) {
        const nextVisibleJob = jobs.slice(index + 1).find(j => !j.isHidden());
        autoAdvancer.advance(nextVisibleJob, AdvanceEvent.FILTER_HIDDEN);
      }
    } else if (job.shouldHide(config)) {
      job.hide();

      if (job.id === currentJobId) {
        const nextVisibleJob = jobs.slice(index + 1).find(j => !j.isHidden());
        autoAdvancer.advance(nextVisibleJob, AdvanceEvent.FILTER_HIDDEN);
      }
    } else {
      job.show();
    }
  });
}
