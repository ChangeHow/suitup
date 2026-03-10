import * as p from "@clack/prompts";
import { brewInstalled, brewInstall } from "../utils/shell.js";

/** All available GUI applications. */
export const APPS = {
  recommended: [
    { value: "iterm2", label: "iTerm2", hint: "terminal emulator" },
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

/**
 * Install selected GUI apps via Homebrew Cask.
 * @param {string[]} apps - list of cask names
 */
export async function installApps(apps) {
  for (const app of apps) {
    if (brewInstalled(app)) {
      p.log.success(`${app} is already installed`);
    } else {
      const s = p.spinner();
      s.start(`Installing ${app}...`);
      const ok = brewInstall(app, { cask: true });
      if (ok) {
        s.stop(`${app} installed`);
      } else {
        s.stop(`Failed to install ${app}`);
      }
    }
  }
}
