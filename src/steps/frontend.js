import * as p from "@clack/prompts";
import { brewInstall, commandExists, run, runStream } from "../utils/shell.js";

async function runStreamChecked(cmd) {
  const exitCode = await runStream(cmd);
  if (exitCode !== 0) {
    throw new Error(`Command exited with status ${exitCode}`);
  }
}

/**
 * Install fnm (Fast Node Manager) and set up Node.js + pnpm.
 */
export async function installFrontendTools() {
  let fnmReady = commandExists("fnm");

  // fnm
  if (fnmReady) {
    p.log.success("fnm is already installed");
  } else {
    p.log.step("Installing fnm...");
    try {
      await runStreamChecked("curl -fsSL https://fnm.vercel.app/install | bash");
      p.log.success("fnm installed");
      fnmReady = true;
    } catch {
      if (commandExists("brew")) {
        p.log.warn("Could not install fnm via curl, trying Homebrew...");
        if (brewInstall("fnm")) {
          p.log.success("fnm installed via Homebrew");
          fnmReady = true;
        } else {
          p.log.warn("Could not install fnm via curl or Homebrew");
        }
      } else {
        p.log.warn("Could not install fnm via curl, and Homebrew is not available");
      }
    }
  }

  // Fetch latest LTS version
  let ltsVersion = "22";
  try {
    const raw = run(
      'curl -sf https://nodejs.org/dist/index.json | jq -r \'[.[] | select(.lts != false)][0].version\' | sed \'s/^v//\'',
      { quiet: true }
    );
    if (raw) ltsVersion = raw;
  } catch {
    p.log.warn(`Could not fetch latest LTS version, defaulting to ${ltsVersion}`);
  }

  // Install Node via fnm
  if (fnmReady || commandExists("fnm")) {
    p.log.step(`Installing Node.js v${ltsVersion} via fnm...`);
    try {
      await runStreamChecked(`fnm install ${ltsVersion} && fnm use ${ltsVersion} && fnm default ${ltsVersion}`);
      p.log.success(`Node.js v${ltsVersion} installed`);
    } catch {
      p.log.warn("Could not install Node.js — fnm may need a shell restart first");
    }
  } else {
    p.log.warn("Skipping Node.js install because fnm is unavailable");
  }

  // pnpm
  if (commandExists("pnpm")) {
    p.log.success("pnpm is already installed");
  } else {
    p.log.step("Installing pnpm...");
    try {
      await runStream("npm install -g pnpm");
      p.log.success("pnpm installed");
    } catch {
      p.log.warn("Could not install pnpm — try running `npm install -g pnpm` manually");
    }
  }

  // git-cz
  if (commandExists("git-cz")) {
    p.log.success("git-cz is already installed");
  } else {
    p.log.step("Installing git-cz...");
    try {
      await runStream("npm install -g git-cz");
      p.log.success("git-cz installed");
    } catch {
      p.log.warn("Could not install git-cz");
    }
  }
}
