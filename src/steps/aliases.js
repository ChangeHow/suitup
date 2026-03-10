import * as p from "@clack/prompts";
import { homedir } from "node:os";
import { join } from "node:path";
import { copyIfNotExists, ensureDir } from "../utils/fs.js";
import { CONFIGS_DIR } from "../constants.js";

/**
 * Set up shell aliases.
 * @param {object} [opts]
 * @param {string} [opts.home] - override home directory (for testing)
 */
export async function setupAliases({ home } = {}) {
  const base = home || homedir();
  const dest = join(base, ".config", "suitup", "aliases");
  ensureDir(join(base, ".config", "suitup"));
  const copied = copyIfNotExists(join(CONFIGS_DIR, "aliases"), dest);
  if (copied) {
    p.log.success("Aliases written to ~/.config/suitup/aliases");
  } else {
    p.log.info("Aliases already exist at ~/.config/suitup/aliases, skipped");
  }
}
