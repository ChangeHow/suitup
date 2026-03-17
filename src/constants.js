import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the configs/ directory in the suitup project. */
export const CONFIGS_DIR = join(__dirname, "..", "configs");

/** Suitup marker used for idempotent append operations. */
export const SUITUP_MARKER = ">>> suitup";
