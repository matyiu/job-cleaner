import { DOMObserver } from "./DOMObserver";
import { JobParser } from "./JobParser";
import { Storage } from "./Storage";

const jobParser = new JobParser();
const storage = new Storage();

new DOMObserver(jobParser, storage).init();
