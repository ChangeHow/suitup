import * as p from "@clack/prompts";
import { existsSync, lstatSync, readlinkSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { brewInstall, commandExists, run, runStream } from "../utils/shell.js";

export const FRONTEND_TOOLS = {
  runtime: [
    { value: "fnm", label: "fnm", hint: "Fast Node Manager" },
    { value: "node", label: "Node.js", hint: "latest LTS via fnm" },
  ],
  packageManagers: [
    { value: "pnpm", label: "pnpm", hint: "fast, disk-efficient package manager" },
  ],
  git: [
    { value: "git-cz", label: "git-cz", hint: "Conventional Commits CLI" },
  ],
};

function getAllFrontendToolValues() {
  return Object.values(FRONTEND_TOOLS).flat().map((tool) => tool.value);
}

function getFnmDir(home) {
  return process.env.FNM_DIR || join(process.env.XDG_DATA_HOME || join(home, ".local", "share"), "fnm");
}

function getFnmDefaultBinDir(home) {
  return join(getFnmDir(home), "aliases", "default", "bin");
}

function cleanupBootstrapNodeShims(home) {
  const bootstrapRoot = join(home, ".local", "share", "suitup", "node");
  const localBin = join(home, ".local", "bin");

  for (const name of ["node", "npm", "npx", "corepack"]) {
    const shimPath = join(localBin, name);
    if (!existsSync(shimPath)) {
      continue;
    }

    try {
      if (!lstatSync(shimPath).isSymbolicLink()) {
        continue;
      }

      const targetPath = readlinkSync(shimPath);
      const resolvedPath = isAbsolute(targetPath) ? targetPath : resolve(localBin, targetPath);
      const relativeTarget = relative(bootstrapRoot, resolvedPath);
      if (relativeTarget.startsWith("..") || isAbsolute(relativeTarget)) {
        continue;
      }

      rmSync(shimPath, { force: true });
    } catch {
      // Keep user-managed files in place when they are unreadable or not ours.
    }
  }
}

/**
 * Build an npm environment that installs global packages into ~/.local.
 * Prepends fnm's default Node bin when available so npm globals target the
 * fnm-managed runtime instead of any temporary bootstrap runtime.
 * @param {string} home
 * @returns {NodeJS.ProcessEnv}
 */
function getUserGlobalNpmEnv(home) {
  const prefix = join(home, ".local");
  const binDir = join(prefix, "bin");
  const fnmDefaultBin = getFnmDefaultBinDir(home);
  const pathParts = [binDir];

  if (existsSync(fnmDefaultBin)) {
    pathParts.unshift(fnmDefaultBin);
    cleanupBootstrapNodeShims(home);
  }

  return {
    ...process.env,
    npm_config_prefix: prefix,
    NPM_CONFIG_PREFIX: prefix,
    PATH: process.env.PATH ? `${pathParts.join(":")}:${process.env.PATH}` : pathParts.join(":"),
  };
}

/**
 * Install selected frontend tools.
 * @param {string[]} [selectedTools]
 * @param {{ home?: string }} [opts]
 */
export async function installFrontendTools(selectedTools = getAllFrontendToolValues(), { home = homedir() } = {}) {
  const wanted = new Set(selectedTools);
  let fnmReady = commandExists("fnm");

  // fnm
  if ((wanted.has("fnm") || wanted.has("node")) && fnmReady) {
    p.log.success("fnm is already installed");
  } else if (wanted.has("fnm") || wanted.has("node")) {
    p.log.step("Installing fnm...");
    try {
      await runStream("curl -fsSL https://fnm.vercel.app/install | bash");
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
  if (wanted.has("node")) {
    try {
      const raw = run(
        'curl -sf https://nodejs.org/dist/index.json | jq -r \'[.[] | select(.lts != false)][0].version\' | sed \'s/^v//\'',
        { quiet: true }
      );
      if (raw) ltsVersion = raw;
    } catch {
      p.log.warn(`Could not fetch latest LTS version, defaulting to ${ltsVersion}`);
    }
  }

  // Install Node via fnm
  if (wanted.has("node") && fnmReady) {
    p.log.step(`Installing Node.js v${ltsVersion} via fnm...`);
    try {
      await runStream(`fnm install ${ltsVersion} && fnm use ${ltsVersion} && fnm default ${ltsVersion}`);
      p.log.success(`Node.js v${ltsVersion} installed`);
      cleanupBootstrapNodeShims(home);
    } catch {
      p.log.warn("Could not install Node.js — fnm may need a shell restart first");
    }
  } else if (wanted.has("node")) {
    p.log.warn("Skipping Node.js install because fnm is unavailable");
  }

  // pnpm
  if (!wanted.has("pnpm")) {
    // skip
  } else if (commandExists("pnpm")) {
    p.log.success("pnpm is already installed");
  } else {
    p.log.step("Installing pnpm...");
    try {
      await runStream("npm install -g pnpm", { env: getUserGlobalNpmEnv(home) });
      p.log.success("pnpm installed");
    } catch {
      p.log.warn("Could not install pnpm automatically — try rerunning after ensuring ~/.local/bin is on PATH");
    }
  }

  // git-cz
  if (!wanted.has("git-cz")) {
    // skip
  } else if (commandExists("git-cz")) {
    p.log.success("git-cz is already installed");
  } else {
    p.log.step("Installing git-cz...");
    try {
      await runStream("npm install -g git-cz", { env: getUserGlobalNpmEnv(home) });
      p.log.success("git-cz installed");
    } catch {
      p.log.warn("Could not install git-cz automatically — try rerunning after ensuring ~/.local/bin is on PATH");
    }
  }
}
