import * as p from "@clack/prompts";
import { commandExists, run, runStream } from "../utils/shell.js";

function isBrewAvailable() {
  return commandExists("brew");
}

async function ensureBrewOnMac() {
  if (isBrewAvailable()) {
    p.log.success("Homebrew is already installed");
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
  await runStream('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
  await runStream('(echo; echo \'eval "$(/opt/homebrew/bin/brew shellenv)"\') >> ~/.zprofile && eval "$(/opt/homebrew/bin/brew shellenv)"');
  p.log.success("Homebrew installed");
  return true;
}

function detectLinuxManagers() {
  const managers = [];
  if (commandExists("apt-get")) managers.push("apt-get");
  if (commandExists("dnf")) managers.push("dnf");
  if (commandExists("yum")) managers.push("yum");
  if (isBrewAvailable()) managers.push("brew");
  return managers;
}

async function chooseLinuxManager() {
  const managers = detectLinuxManagers();
  if (managers.length === 0) {
    p.log.warn("No supported package manager detected. Skipping package manager setup.");
    return "skip";
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
export async function bootstrap({ platform = process.platform } = {}) {
  let manager = "skip";

  if (platform === "darwin") {
    const brewReady = await ensureBrewOnMac();
    manager = brewReady ? "brew" : "skip";
  } else if (platform === "linux") {
    manager = await chooseLinuxManager();
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
}
