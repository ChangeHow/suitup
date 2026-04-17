import * as p from "@clack/prompts";
import { commandExists, run, runStream } from "../utils/shell.js";

const BREW_INSTALL_COMMAND = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
const BREW_SHELLENV_COMMAND = "(echo; echo 'eval \"$(/opt/homebrew/bin/brew shellenv)\"') >> ~/.zprofile && eval \"$(/opt/homebrew/bin/brew shellenv)\"";

function isBrewAvailable() {
  return commandExists("brew");
}

async function ensureBrewOnMac({ defaults = false } = {}) {
  if (isBrewAvailable()) {
    p.log.success("Homebrew is already installed");
    return true;
  }

  if (defaults) {
    p.log.step("Installing Homebrew...");
    await runStream(BREW_INSTALL_COMMAND);
    await runStream(BREW_SHELLENV_COMMAND);
    p.log.success("Homebrew installed");
    return true;
  }

  const choice = await p.select({
    message: "Homebrew not found. How do you want to continue?",
    options: [
      { value: "install", label: "Install Homebrew", hint: "recommended" },
      { value: "skip", label: "Skip package manager", hint: "continue without brew" },
    ],
    initialValue: "install",
  });

  if (p.isCancel(choice) || choice === "skip") {
    p.log.warn("Skipped Homebrew setup. Some later install steps may fail without brew.");
    return false;
  }

  p.log.step("Installing Homebrew...");
  await runStream(BREW_INSTALL_COMMAND);
  await runStream(BREW_SHELLENV_COMMAND);
  p.log.success("Homebrew installed");
  return true;
}

function detectLinuxManagers() {
  const managers = ["brew"];
  if (commandExists("apt-get")) managers.push("apt-get");
  if (commandExists("dnf")) managers.push("dnf");
  if (commandExists("yum")) managers.push("yum");
  return managers;
}

/**
 * Install Homebrew on Linux when requested.
 * @param {{ defaults?: boolean }} [opts]
 * @returns {Promise<{ ready: boolean, freshlyInstalled: boolean }>}
 */
async function ensureBrewOnLinux({ defaults = false } = {}) {
  if (isBrewAvailable()) {
    p.log.success("Homebrew is already installed");
    return { ready: true, freshlyInstalled: false };
  }

  if (!defaults) {
    const choice = await p.select({
      message: "Homebrew is not installed. How do you want to continue?",
      options: [
        { value: "install", label: "Install Homebrew", hint: "recommended — rerun suitup after install" },
        { value: "skip", label: "Skip package manager", hint: "continue without brew" },
      ],
      initialValue: "install",
    });

    if (p.isCancel(choice) || choice === "skip") {
      p.log.warn("Skipped Homebrew setup. Brew-based install steps will stay unavailable until Homebrew is installed.");
      return { ready: false, freshlyInstalled: false };
    }
  }

  p.log.step("Installing Homebrew...");
  await runStream(BREW_INSTALL_COMMAND);
  p.log.success("Homebrew installed");
  return { ready: true, freshlyInstalled: true };
}

async function chooseLinuxManager({ defaults = false } = {}) {
  const managers = detectLinuxManagers();
  if (managers.length === 0) {
    p.log.warn("No supported package manager detected. Skipping package manager setup.");
    return "skip";
  }

  if (defaults) {
    p.log.info(`Using ${managers[0]} for bootstrap`);
    return managers[0];
  }

  const labels = {
    "apt-get": "apt-get",
    dnf: "dnf",
    yum: "yum",
    brew: "brew",
  };

  const choice = await p.select({
    message: "Choose package manager for bootstrap:",
    options: [
      ...managers.map((manager, idx) => ({
        value: manager,
        label: labels[manager],
        hint: idx === 0 ? "recommended" : undefined,
      })),
      { value: "skip", label: "Skip package manager", hint: "manual install" },
    ],
    initialValue: managers[0],
  });

  if (p.isCancel(choice)) {
    return "skip";
  }
  return choice;
}

async function installZshViaManager(manager) {
  if (commandExists("zsh")) {
    p.log.success("Zsh is already installed");
    return;
  }

  if (manager === "skip") {
    p.log.warn("Skipped Zsh install because package manager setup was skipped.");
    return;
  }

  p.log.step("Installing Zsh...");
  if (manager === "brew") {
    await runStream("brew install zsh");
  } else if (manager === "apt-get") {
    await runStream("sudo apt-get update && sudo apt-get install -y zsh");
  } else if (manager === "dnf") {
    await runStream("sudo dnf install -y zsh");
  } else if (manager === "yum") {
    await runStream("sudo yum install -y zsh");
  }
  p.log.success("Zsh installed");
}

/**
 * Install package manager baseline + Zsh.
 */
export async function bootstrap({ platform = process.platform, defaults = false } = {}) {
  let manager = "skip";

  if (platform === "darwin") {
    const brewReady = await ensureBrewOnMac({ defaults });
    manager = brewReady ? "brew" : "skip";
  } else if (platform === "linux") {
    manager = await chooseLinuxManager({ defaults });
    if (manager === "brew") {
      const brewResult = await ensureBrewOnLinux({ defaults });
      manager = brewResult.ready ? "brew" : "skip";

      if (brewResult.freshlyInstalled) {
        return { manager, shouldRerun: true };
      }
    }
  } else {
    p.log.warn(`Unsupported platform: ${platform}. Skipping package manager setup.`);
  }

  await installZshViaManager(manager);

  // Set Zsh as default shell
  try {
    const currentShell = run("echo $SHELL", { quiet: true });
    const zshPath = run("which zsh", { quiet: true });
    if (currentShell !== zshPath) {
      p.log.step("Setting Zsh as default shell...");
      await runStream(`chsh -s "${zshPath}"`);
      p.log.success("Zsh set as default shell");
    } else {
      p.log.success("Zsh is already the default shell");
    }
  } catch {
    p.log.warn("Could not set Zsh as default shell automatically");
  }

  return { manager, shouldRerun: false };
}
