import { describe, test, expect, vi, beforeEach } from "vitest";

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
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: fetch LTS version fails gracefully
    run.mockImplementation(() => { throw new Error("no curl"); });
  });

  test("skips all tools when already installed", async () => {
    commandExists.mockReturnValue(true);

    await installFrontendTools();

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

    await installFrontendTools();

    const calls = runStream.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.includes("fnm.vercel.app"))).toBe(true);
  });

  test("falls back to Homebrew when fnm curl install fails", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "fnm") return false;
      if (name === "brew") return true;
      return true;
    });
    runStream.mockImplementationOnce(() => Promise.resolve(22));
    brewInstall.mockReturnValue(true);

    await installFrontendTools();

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
    runStream.mockImplementationOnce(() => Promise.resolve(22));

    await installFrontendTools();

    expect(brewInstall).not.toHaveBeenCalled();
    expect(p.log.success).not.toHaveBeenCalledWith("fnm installed");
    expect(p.log.warn).toHaveBeenCalledWith("Could not install fnm via curl, and Homebrew is not available");
    expect(p.log.warn).toHaveBeenCalledWith("Skipping Node.js install because fnm is unavailable");
  });

  test("sets fnm default after installing node", async () => {
    commandExists.mockReturnValue(true);

    await installFrontendTools();

    const calls = runStream.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.includes("fnm default"))).toBe(true);
  });

  test("installs pnpm when not present", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "pnpm") return false;
      return true;
    });

    await installFrontendTools();

    const calls = runStream.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.includes("npm install -g pnpm"))).toBe(true);
  });

  test("installs git-cz when not present", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "git-cz") return false;
      return true;
    });

    await installFrontendTools();

    const calls = runStream.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.includes("npm install -g git-cz"))).toBe(true);
  });
});
