import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { bootstrap } from "./steps/bootstrap.js";
import { installZinit } from "./steps/plugin-manager.js";
import { CLI_TOOLS, installCliTools } from "./steps/cli-tools.js";
import { APPS, installApps } from "./steps/apps.js";
import { installFrontendTools } from "./steps/frontend.js";
import { setupSsh } from "./steps/ssh.js";
import { setupVim } from "./steps/vim.js";
import { setupAliases } from "./steps/aliases.js";
import { cleanDock } from "./steps/dock.js";
import { setupZshConfig, writeZshrc, writeZshenv } from "./steps/zsh-config.js";
import { isZshShell } from "./utils/shell-context.js";
export { isZshShell } from "./utils/shell-context.js";

/**
 * Full interactive setup flow.
 */
export function getDefaultSteps(platform = process.platform) {
  return [
    "bootstrap",
    "zsh-config",
    "plugins",
    "cli-tools",
    ...(platform === "linux" ? [] : ["apps"]),
    "frontend",
    "aliases",
  ];
}

export async function runSetup() {
  p.intro(pc.bgCyan(pc.black(" Suit up! ")));

  if (!isZshShell()) {
    p.log.error("Suitup setup must be run from zsh.");
    p.log.info("Switch to zsh first: run `zsh` for this session or `chsh -s \"$(which zsh)\"` to make it your default shell.");
    p.outro("No changes made.");
    return;
  }

  // --- Step 1: Select setup steps ---
  const steps = await p.multiselect({
    message: "Select setup steps:",
    required: true,
    options: [
      { value: "bootstrap", label: "Bootstrap", hint: "Package manager + Zsh" },
      { value: "zsh-config", label: "Zsh Config Structure", hint: "~/.config/zsh/" },
      { value: "plugins", label: "Plugin Manager", hint: "recommended zinit or skip" },
      { value: "cli-tools", label: "CLI Tools", hint: "bat, eza, fzf, fd, zoxide, atuin..." },
      { value: "apps", label: "GUI Apps", hint: "iTerm2, Raycast, VS Code..." },
      { value: "frontend", label: "Frontend Tools", hint: "fnm, pnpm, git-cz" },
      { value: "aliases", label: "Shell Aliases", hint: "git, eza, fzf shortcuts" },
      { value: "ssh", label: "SSH Key", hint: "generate GitHub SSH key" },
      { value: "vim", label: "Vim Config", hint: "basic vim setup" },
      { value: "dock", label: "Dock Cleanup", hint: "clean macOS Dock" },
    ],
    initialValues: getDefaultSteps(),
  });

  if (p.isCancel(steps)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  // --- Step 2: Plugin manager choice (if selected) ---
  let pluginManager = "zinit";
  if (steps.includes("plugins")) {
    const pmChoice = await p.select({
      message: "Choose plugin manager setup:",
      options: [
        { value: "zinit", label: "zinit", hint: "recommended - lightweight, fast, enough for most setups" },
        { value: "skip", label: "Skip plugin manager", hint: "keep native zsh features only" },
      ],
      initialValue: "zinit",
    });
    if (p.isCancel(pmChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    pluginManager = pmChoice;
  }

  let promptTheme = "p10k";
  if (steps.includes("zsh-config") || steps.includes("plugins")) {
    const promptChoice = await p.select({
      message: "Choose a prompt preset:",
      options: [
        {
          value: "p10k",
          label: "Powerlevel10k",
          hint: "recommended - async git status stays fast in large repositories",
        },
        {
          value: "basic",
          label: "Basic zsh prompt",
          hint: "no Powerlevel10k, simple and dependency-free",
        },
      ],
      initialValue: "p10k",
    });
  if (p.isCancel(promptChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    promptTheme = promptChoice;
  }

  const zinitHome = join(
    process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"),
    "zinit",
    "zinit.git"
  );
  const willInstallZinit = steps.includes("plugins") && pluginManager === "zinit";
  if (promptTheme === "p10k" && !(willInstallZinit || existsSync(zinitHome))) {
    p.log.warn("Powerlevel10k needs zinit. Since zinit is not installed or selected, suitup falls back to the Basic prompt.");
    promptTheme = "basic";
  }

  // --- Step 3: CLI tool selection (if selected) ---
  let selectedTools = [];
  if (steps.includes("cli-tools")) {
    const toolChoice = await p.groupMultiselect({
      message: "Select CLI tools to install:",
      required: true,
      options: {
        Essentials: CLI_TOOLS.essentials,
        "Shell Enhancement": CLI_TOOLS.shell,
        Optional: CLI_TOOLS.optional,
      },
    });
    if (p.isCancel(toolChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    selectedTools = toolChoice;
  }

  // --- Step 4: App selection (if selected) ---
  let selectedApps = [];
  if (steps.includes("apps")) {
    const appChoice = await p.groupMultiselect({
      message: "Select apps to install:",
      options: {
        Recommended: APPS.recommended,
        Optional: APPS.optional,
        Fonts: APPS.fonts,
      },
    });
    if (p.isCancel(appChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    selectedApps = appChoice;
  }

  // --- Execute selected steps ---
  p.log.step(pc.bold("Starting installation..."));

  if (steps.includes("bootstrap")) {
    await bootstrap();
  }

  if (steps.includes("zsh-config")) {
    await setupZshConfig({ promptTheme });
  }

  if (steps.includes("plugins")) {
    if (pluginManager === "zinit") {
      await installZinit();
    }
  }

  if (steps.includes("cli-tools")) {
    await installCliTools(selectedTools);
  }

  if (steps.includes("apps")) {
    await installApps(selectedApps);
  }

  if (steps.includes("frontend")) {
    await installFrontendTools();
  }

  if (steps.includes("aliases")) {
    await setupAliases();
  }

  if (steps.includes("ssh")) {
    await setupSsh();
  }

  if (steps.includes("vim")) {
    await setupVim();
  }

  if (steps.includes("dock")) {
    await cleanDock();
  }

  // --- Write .zshrc ---
  if (steps.includes("zsh-config")) {
    await writeZshrc(pluginManager);
    await writeZshenv();
  }

  if (promptTheme === "p10k" && !existsSync(join(homedir(), ".p10k.zsh"))) {
    p.log.info("Powerlevel10k is selected, but `~/.p10k.zsh` was not found. Suitup keeps a basic prompt until you run `p10k configure` in zsh, which avoids dropping you into an interactive wizard during setup.");
  }

  p.outro(
    `Done! Run ${pc.cyan("exec zsh")} to reload your shell.\n` +
    `  Problems? ${pc.underline(pc.cyan("https://github.com/ChangeHow/suitup/issues"))}`
  );
}
