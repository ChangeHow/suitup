import * as p from "@clack/prompts";
import { cpSync, existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { brewInstall } from "../utils/shell.js";
import { CONFIGS_DIR } from "../constants.js";

/** All available GUI applications. */
export const APPS = {
  recommended: [
    { value: "ghostty", label: "Ghostty", hint: "terminal emulator" },
    { value: "raycast", label: "Raycast", hint: "launcher & productivity" },
    { value: "visual-studio-code", label: "VS Code", hint: "code editor" },
  ],
  optional: [
    { value: "itsycal", label: "Itsycal", hint: "menu bar calendar" },
    { value: "postman", label: "Postman", hint: "API client" },
    { value: "paper", label: "Pap.er", hint: "wallpaper app" },
  ],
  fonts: [
    { value: "font-monaspace", label: "Monaspace", hint: "coding font by GitHub" },
    { value: "font-space-mono", label: "Space Mono", hint: "monospace font" },
  ],
};

export async function setupGhosttyConfig({ home = homedir() } = {}) {
  const shouldInitialize = await p.confirm({
    message: "Initialize Ghostty with the suitup preset?",
    initialValue: true,
  });
  if (p.isCancel(shouldInitialize) || !shouldInitialize) {
    p.log.info("Ghostty config left unchanged");
    return false;
  }

  const destination = join(home, ".config", "ghostty");
  if (existsSync(destination)) {
    const backup = `${destination}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    cpSync(destination, backup, { recursive: true });
    p.log.info(`Existing Ghostty config backed up to ${backup.replace(home, "~")}`);
    rmSync(destination, { recursive: true, force: true });
  }

  cpSync(join(CONFIGS_DIR, "ghostty"), destination, { recursive: true });
  p.log.success("Ghostty config initialized at ~/.config/ghostty/");
  return true;
}

/**
 * Install selected GUI apps via Homebrew Cask.
 * @param {string[]} apps - list of cask names
 * @param {{ configureGhostty?: boolean }} [opts]
 */
export async function installApps(apps, { configureGhostty = true } = {}) {
  for (const app of apps) {
    const s = p.spinner();
    s.start(`Installing or updating ${app}...`);
    const ok = brewInstall(app, { cask: true });
    if (ok) {
      s.stop(`${app} is ready`);
    } else {
      s.stop(`Failed to install ${app}`);
    }
  }

  if (configureGhostty && apps.includes("ghostty")) {
    await setupGhosttyConfig();
  }
}
