import { DOMObserver } from "./DOMObserver";
import { CONFIG_UPDATED } from "./events";
import type { Job } from "./Job";
import { JobParser } from "./JobParser";
import { JobState } from "./JobState";
import { Storage } from "./Storage";
import { AutoAdvancer } from "./AutoAdvancer";
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

  jobState.get().forEach((job: Job) => {
    if (job.shouldHide(config)) {
      job.hide();
    } else {
      job.show();
    }
  });
}
