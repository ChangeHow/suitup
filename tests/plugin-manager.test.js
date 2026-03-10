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

import { installZinit, installOhMyZsh } from "../src/steps/plugin-manager.js";
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
    expect(existsSync(join(sandbox.path, ".config", "suitup", "zinit-plugins"))).toBe(true);
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
    mkdirSync(join(sandbox.path, ".config", "suitup"), { recursive: true });
    writeFileSync(join(sandbox.path, ".config", "suitup", "zinit-plugins"), "existing", "utf-8");

    await installZinit({ home: sandbox.path });

    // Should not have been overwritten
    const { readFileSync } = await import("node:fs");
    const content = readFileSync(join(sandbox.path, ".config", "suitup", "zinit-plugins"), "utf-8");
    expect(content).toBe("existing");
  });

  test("installs Oh My Zsh when directory does not exist", async () => {
    await installOhMyZsh({ home: sandbox.path });

    // Should call runStream for OMZ install + p10k + 2 plugins = 4 calls
    expect(runStream).toHaveBeenCalledWith(
      expect.stringContaining("ohmyzsh")
    );
  });

  test("skips Oh My Zsh install when directory already exists", async () => {
    // Create OMZ directory
    mkdirSync(join(sandbox.path, ".oh-my-zsh"), { recursive: true });
    // Still need p10k and plugins dirs to skip those too
    mkdirSync(join(sandbox.path, ".oh-my-zsh", "custom", "themes", "powerlevel10k"), { recursive: true });
    mkdirSync(join(sandbox.path, ".oh-my-zsh", "custom", "plugins", "zsh-autosuggestions"), { recursive: true });
    mkdirSync(join(sandbox.path, ".oh-my-zsh", "custom", "plugins", "zsh-syntax-highlighting"), { recursive: true });

    await installOhMyZsh({ home: sandbox.path });

    expect(runStream).not.toHaveBeenCalled();
  });
});
