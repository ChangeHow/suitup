import * as p from "@clack/prompts";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { commandExists, run, runStream } from "../utils/shell.js";
import { copyIfNotExists, ensureDir } from "../utils/fs.js";
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

  // Copy plugin config (skip if already exists)
  const dest = join(base, ".config", "suitup", "zinit-plugins");
  ensureDir(join(base, ".config", "suitup"));
  const copied = copyIfNotExists(join(CONFIGS_DIR, "zinit-plugins"), dest);
  if (copied) {
    p.log.success("zinit plugin config written to ~/.config/suitup/zinit-plugins");
  } else {
    p.log.info("zinit plugin config already exists, skipped");
  }
}

/**
 * Install Oh My Zsh (alternative plugin manager).
 * @param {object} [opts]
 * @param {string} [opts.home] - override home directory (for testing)
 */
export async function installOhMyZsh({ home, promptTheme = "p10k" } = {}) {
  const base = home || homedir();
  const omzDir = join(base, ".oh-my-zsh");

  if (existsSync(omzDir)) {
    p.log.success("Oh My Zsh is already installed");
  } else {
    p.log.step("Installing Oh My Zsh...");
    await runStream(
      'sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended'
    );
    p.log.success("Oh My Zsh installed");
  }

  // Install OMZ plugins
  const pluginsDir = join(omzDir, "custom", "plugins");
  for (const plugin of ["zsh-autosuggestions", "zsh-syntax-highlighting"]) {
    const dir = join(pluginsDir, plugin);
    if (!existsSync(dir)) {
      p.log.step(`Installing ${plugin}...`);
      await runStream(
        `git clone https://github.com/zsh-users/${plugin} "${dir}"`
      );
    }
  }

  if (promptTheme === "p10k") {
    const p10kDir = join(omzDir, "custom", "themes", "powerlevel10k");
    if (!existsSync(p10kDir)) {
      p.log.step("Installing Powerlevel10k theme for Oh My Zsh...");
      await runStream(
        `git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "${p10kDir}"`
      );
    }
  }

  p.log.success("Oh My Zsh with plugins configured");
}
