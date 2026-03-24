import * as p from "@clack/prompts";
import { homedir } from "node:os";
import { join } from "node:path";
import { copyIfNotExists, appendIfMissing } from "../utils/fs.js";
import { CONFIGS_DIR } from "../constants.js";

/**
 * Set up Vim configuration.
 * @param {object} [opts]
 * @param {string} [opts.home] - override home directory (for testing)
 */
export async function setupVim({ home } = {}) {
  const base = home || homedir();
  const zshLocal = join(base, ".config", "zsh", "local");
  const vimCfg = join(zshLocal, "config.vim");
  const vimrc = join(base, ".vimrc");

  // Copy vim config (skip if already exists)
  const copied = copyIfNotExists(join(CONFIGS_DIR, "config.vim"), vimCfg);
  if (copied) {
    p.log.success("Vim config written to ~/.config/zsh/local/config.vim");
  } else {
    p.log.info("Vim config already exists, skipped");
  }

  // Ensure .vimrc sources it
  const marker = "source " + vimCfg;
  const appended = appendIfMissing(vimrc, `source ${vimCfg}\n`, marker);
  if (appended) {
    p.log.success(".vimrc configured to source suitup vim config");
  } else {
    p.log.info(".vimrc already sources suitup vim config, skipped");
  }
}
