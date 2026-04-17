import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, symlinkSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

vi.mock("@clack/prompts", () => ({
  log: { success: vi.fn(), step: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

vi.mock("../src/utils/shell.js", () => ({
  commandExists: vi.fn(),
  brewInstalled: vi.fn(),
  brewInstall: vi.fn(() => true),
  run: vi.fn(() => ""),
  runStream: vi.fn(() => Promise.resolve(0)),
}));

import { installFrontendTools } from "../src/steps/frontend.js";
import { brewInstall, commandExists, run, runStream } from "../src/utils/shell.js";
import * as p from "@clack/prompts";

describe("frontend step", () => {
  let sandbox;

  beforeEach(() => {
    vi.clearAllMocks();
    sandbox = mkdtempSync(join(tmpdir(), "suitup-frontend-"));
    // Default: fetch LTS version fails gracefully
    run.mockImplementation(() => { throw new Error("no curl"); });
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  test("skips all tools when already installed", async () => {
    commandExists.mockReturnValue(true);

    await installFrontendTools(undefined, { home: sandbox });

    // runStream should only be called for Node install via fnm (always runs)
    const calls = runStream.mock.calls.map((c) => c[0]);
    // Should NOT contain curl fnm install or npm install -g
    expect(calls.some((c) => c.includes("fnm.vercel.app"))).toBe(false);
    expect(calls.some((c) => c.includes("npm install -g pnpm"))).toBe(false);
    expect(calls.some((c) => c.includes("npm install -g git-cz"))).toBe(false);
  });

  test("installs fnm when not present", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "fnm") return false;
      return true; // pnpm and git-cz are installed
    });

    await installFrontendTools(["fnm"], { home: sandbox });

    const calls = runStream.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.includes("fnm.vercel.app"))).toBe(true);
  });

  test("falls back to Homebrew when fnm curl install fails", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "fnm") return false;
      if (name === "brew") return true;
      return true;
    });
    runStream.mockImplementationOnce(() => Promise.reject(new Error("curl exited with HTTP error 22")));
    brewInstall.mockReturnValue(true);

    await installFrontendTools(["fnm"], { home: sandbox });

    expect(brewInstall).toHaveBeenCalledWith("fnm");
    expect(p.log.success).not.toHaveBeenCalledWith("fnm installed");
    expect(p.log.warn).toHaveBeenCalledWith("Could not install fnm via curl, trying Homebrew...");
    expect(p.log.success).toHaveBeenCalledWith("fnm installed via Homebrew");
  });

  test("warns when fnm curl install fails and Homebrew is unavailable", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "fnm" || name === "brew") return false;
      return true;
    });
    runStream.mockImplementationOnce(() => Promise.reject(new Error("curl exited with HTTP error 22")));

    await installFrontendTools(["node"], { home: sandbox });

    expect(brewInstall).not.toHaveBeenCalled();
    expect(p.log.success).not.toHaveBeenCalledWith("fnm installed");
    expect(p.log.warn).toHaveBeenCalledWith("Could not install fnm via curl, and Homebrew is not available");
    expect(p.log.warn).toHaveBeenCalledWith("Skipping Node.js install because fnm is unavailable");
  });

  test("sets fnm default after installing node", async () => {
    commandExists.mockReturnValue(true);

    await installFrontendTools(["node"], { home: sandbox });

    const calls = runStream.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.includes("fnm default"))).toBe(true);
  });

  test("installs pnpm when not present", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "pnpm") return false;
      return true;
    });

    await installFrontendTools(["pnpm"], { home: sandbox });

    expect(runStream).toHaveBeenCalledWith(
      "npm install -g pnpm",
      expect.objectContaining({
        env: expect.objectContaining({
          npm_config_prefix: expect.stringContaining(".local"),
          NPM_CONFIG_PREFIX: expect.stringContaining(".local"),
        }),
      })
    );
  });

  test("installs git-cz when not present", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "git-cz") return false;
      return true;
    });

    await installFrontendTools(["git-cz"], { home: sandbox });

    expect(runStream).toHaveBeenCalledWith(
      "npm install -g git-cz",
      expect.objectContaining({
        env: expect.objectContaining({
          npm_config_prefix: expect.stringContaining(".local"),
          NPM_CONFIG_PREFIX: expect.stringContaining(".local"),
        }),
      })
    );
  });

  test("only installs the selected frontend tools", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "git-cz") return false;
      return true;
    });

    await installFrontendTools(["git-cz"], { home: sandbox });

    const calls = runStream.mock.calls.map((call) => call[0]);
    expect(calls.some((cmd) => cmd.includes("fnm install"))).toBe(false);
    expect(calls).toContain("npm install -g git-cz");
    expect(calls.some((cmd) => cmd.includes("npm install -g pnpm"))).toBe(false);
  });

  test("removes legacy bootstrap node shims when fnm default node exists", async () => {
    const bootstrapBin = join(sandbox, ".local", "share", "suitup", "node", "node-v20.0.0-linux-x64", "bin");
    const fnmDefaultBin = join(sandbox, ".local", "share", "fnm", "aliases", "default", "bin");
    const localBin = join(sandbox, ".local", "bin");

    mkdirSync(bootstrapBin, { recursive: true });
    mkdirSync(fnmDefaultBin, { recursive: true });
    mkdirSync(localBin, { recursive: true });
    writeFileSync(join(bootstrapBin, "node"), "", "utf-8");
    writeFileSync(join(fnmDefaultBin, "npm"), "", "utf-8");
    symlinkSync(join(bootstrapBin, "node"), join(localBin, "node"));

    commandExists.mockImplementation((name) => {
      if (name === "pnpm") return false;
      return true;
    });

    await installFrontendTools(["pnpm"], { home: sandbox });

    expect(existsSync(join(localBin, "node"))).toBe(false);
    expect(runStream).toHaveBeenCalledWith(
      "npm install -g pnpm",
      expect.objectContaining({
        env: expect.objectContaining({
          PATH: expect.stringContaining(fnmDefaultBin),
        }),
      })
    );
  });
});
