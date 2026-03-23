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
  const dest = join(base, ".config", "zsh", "shared", "aliases.zsh");
  ensureDir(join(base, ".config", "zsh", "shared"));
  const copied = copyIfNotExists(join(CONFIGS_DIR, "shared", "aliases.zsh"), dest);
  if (copied) {
    p.log.success("Aliases written to ~/.config/zsh/shared/aliases.zsh");
  } else {
    p.log.info("Aliases already exist at ~/.config/zsh/shared/aliases.zsh, skipped");
  }
}
