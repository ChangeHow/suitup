import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createSandbox } from "./helpers.js";

vi.mock("@clack/prompts", () => ({
  log: { success: vi.fn(), step: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  confirm: vi.fn(),
  text: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock("../src/utils/shell.js", () => ({
  commandExists: vi.fn(),
  brewInstalled: vi.fn(),
  brewInstall: vi.fn(() => true),
  run: vi.fn(() => ""),
  runStream: vi.fn(() => Promise.resolve(0)),
}));

import { installZinit } from "../src/steps/plugin-manager.js";
import { runStream } from "../src/utils/shell.js";

describe("plugin-manager step", () => {
  let sandbox;

  beforeEach(() => {
    vi.clearAllMocks();
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.cleanup();
  });

  test("installs zinit when directory does not exist", async () => {
    await installZinit({ home: sandbox.path });

    expect(runStream).toHaveBeenCalledWith(
      expect.stringContaining("zinit")
    );
    // Plugin config should be written
    expect(existsSync(join(sandbox.path, ".config", "zsh", "shared", "plugins.zsh"))).toBe(true);
  });

  test("skips zinit install when directory already exists", async () => {
    // Create the zinit directory
    mkdirSync(join(sandbox.path, ".local", "share", "zinit", "zinit.git"), { recursive: true });

    await installZinit({ home: sandbox.path });

    expect(runStream).not.toHaveBeenCalled();
  });

  test("skips zinit plugin config when already exists", async () => {
    // Create zinit dir to skip install
    mkdirSync(join(sandbox.path, ".local", "share", "zinit", "zinit.git"), { recursive: true });
    // Pre-create the plugin config
    mkdirSync(join(sandbox.path, ".config", "zsh", "shared"), { recursive: true });
    writeFileSync(join(sandbox.path, ".config", "zsh", "shared", "plugins.zsh"), "existing", "utf-8");

    await installZinit({ home: sandbox.path });

    // Should not have been overwritten
    const { readFileSync } = await import("node:fs");
    const content = readFileSync(join(sandbox.path, ".config", "zsh", "shared", "plugins.zsh"), "utf-8");
    expect(content).toBe("existing");
  });

});
