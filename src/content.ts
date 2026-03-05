import { DOMObserver } from "./DOMObserver";
import { CONFIG_UPDATED } from "./events";
import type { Job } from "./Job";
import { JobParser } from "./JobParser";
import { JobState } from "./JobState";
import { Storage } from "./Storage";

const jobParser = new JobParser();
const storage = new Storage();
const jobState = new JobState();

new DOMObserver(jobParser, jobState).init(handleJobFilter);

chrome.runtime.onMessage.addListener((message) => {
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

