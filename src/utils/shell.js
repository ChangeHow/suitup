import { execSync, spawn } from "node:child_process";

export class ShellCommandError extends Error {
  constructor(cmd, { code = null, signal = null } = {}) {
    const interrupted = signal === "SIGINT" || code === 130;
    super(interrupted ? `Command interrupted: ${cmd}` : `Command failed with exit code ${code}: ${cmd}`);
    this.name = "ShellCommandError";
    this.command = cmd;
    this.exitCode = code;
    this.signal = signal;
    this.interrupted = interrupted;
  }
}

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
 * Returns a promise that resolves on success and rejects with ShellCommandError
 * when the command exits non-zero or is interrupted.
 * @param {string} cmd
 * @param {{ env?: Record<string,string> }} [opts]
 */
export function runStream(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    const spawnOpts = { stdio: "inherit" };
    if (opts.env) spawnOpts.env = opts.env;
    const child = spawn("bash", ["-c", cmd], spawnOpts);

    const forwardSigint = () => {
      child.kill("SIGINT");
    };

    const cleanup = () => {
      process.off("SIGINT", forwardSigint);
    };

    process.once("SIGINT", forwardSigint);

    child.on("close", (code, signal) => {
      cleanup();

      if (signal === "SIGINT" || code === 130) {
        reject(new ShellCommandError(cmd, { code, signal }));
        return;
      }

      if (code !== 0) {
        reject(new ShellCommandError(cmd, { code, signal }));
        return;
      }

      resolve(0);
    });
    child.on("error", (error) => {
      cleanup();
      reject(error);
    });
  });
}
