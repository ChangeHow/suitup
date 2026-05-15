import * as p from "@clack/prompts";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { runStream } from "../utils/shell.js";
import { ensureDir } from "../utils/fs.js";
import { applyManagedConfigUpdate } from "../utils/config-diff.js";
import { CONFIGS_DIR } from "../constants.js";

/**
 * Install zinit plugin manager and set up plugin config.
 * @param {object} [opts]
 * @param {string} [opts.home] - override home directory (for testing)
 */
export async function installZinit({ home } = {}) {
  const base = home || homedir();
  const zinitHome = join(
    process.env.XDG_DATA_HOME || join(base, ".local", "share"),
    "zinit",
    "zinit.git"
  );

  if (existsSync(zinitHome)) {
    p.log.success("zinit is already installed");
  } else {
    p.log.step("Installing zinit...");
    await runStream(
      `bash -c 'NO_INPUT=1 bash -c "$(curl --fail --show-error --silent --location https://raw.githubusercontent.com/zdharma-continuum/zinit/HEAD/scripts/install.sh)"'`
    );
    p.log.success("zinit installed");
  }

  const dest = join(base, ".config", "zsh", "shared", "plugins.zsh");
  ensureDir(join(base, ".config", "zsh", "shared"));
  await applyManagedConfigUpdate({
    source: join(CONFIGS_DIR, "shared", "plugins.zsh"),
    dest,
    label: "zinit plugin config",
    home: base,
  });
}
