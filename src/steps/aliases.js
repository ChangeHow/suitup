import { homedir } from "node:os";
import { join } from "node:path";
import { ensureDir } from "../utils/fs.js";
import { applyManagedConfigUpdate } from "../utils/config-diff.js";
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
  await applyManagedConfigUpdate({
    source: join(CONFIGS_DIR, "shared", "aliases.zsh"),
    dest,
    label: "aliases",
    home: base,
  });
}
