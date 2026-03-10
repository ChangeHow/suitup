import { execSync, spawn } from "node:child_process";

/**
 * Run a shell command synchronously. Returns stdout as string.
 * Throws on non-zero exit.
 */
export function run(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: "utf-8",
    stdio: opts.quiet ? "pipe" : ["pipe", "pipe", "pipe"],
    ...opts,
  }).trim();
}

/**
 * Check whether a command exists in PATH.
 */
export function commandExists(name) {
  try {
    execSync(`command -v ${name}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check whether a Homebrew formula/cask is installed.
 */
export function brewInstalled(name) {
  try {
    execSync(`brew list ${name}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Install a Homebrew formula or cask. Returns true on success.
 */
export function brewInstall(name, { cask = false } = {}) {
  const args = cask ? ["install", "--cask", name] : ["install", name];
  try {
    execSync(`brew ${args.join(" ")}`, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a shell command and stream output to stdout/stderr in real-time.
 * Returns a promise that resolves with the exit code.
 */
export function runStream(cmd) {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["-c", cmd], { stdio: "inherit" });
    child.on("close", (code) => resolve(code));
    child.on("error", reject);
  });
}
