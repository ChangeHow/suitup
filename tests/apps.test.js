import { describe, test, expect, vi, beforeEach } from "vitest";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createSandbox } from "./helpers.js";

const { mockConfirm } = vi.hoisted(() => ({ mockConfirm: vi.fn() }));

vi.mock("@clack/prompts", () => ({
  log: { success: vi.fn(), step: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  confirm: mockConfirm,
  isCancel: vi.fn(() => false),
}));

vi.mock("../src/utils/shell.js", () => ({
  commandExists: vi.fn(),
  brewInstalled: vi.fn(),
  brewInstall: vi.fn(() => true),
  run: vi.fn(() => ""),
  runStream: vi.fn(() => Promise.resolve(0)),
}));

import { APPS, installApps, setupGhosttyConfig } from "../src/steps/apps.js";
import { brewInstall } from "../src/utils/shell.js";

describe("apps step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockResolvedValue(true);
  });

  test("installs or updates every selected app", async () => {
    await installApps(["raycast", "visual-studio-code"]);

    expect(brewInstall).toHaveBeenCalledTimes(2);
    expect(brewInstall).toHaveBeenCalledWith("raycast", { cask: true });
    expect(brewInstall).toHaveBeenCalledWith("visual-studio-code", { cask: true });
  });

  test("continues when a selected app fails", async () => {
    brewInstall.mockImplementation((name) => name !== "visual-studio-code");

    await installApps(["visual-studio-code", "raycast"], { configureGhostty: false });

    expect(brewInstall).toHaveBeenCalledTimes(2);
  });

  test("offers Ghostty instead of iTerm2", () => {
    expect(APPS.recommended.map((app) => app.value)).toContain("ghostty");
    expect(APPS.recommended.map((app) => app.value)).not.toContain("iterm2");
  });

  test("initializes the sanitized Ghostty preset after backing up existing config", async () => {
    const sandbox = createSandbox();
    const ghostty = join(sandbox.path, ".config", "ghostty");
    mkdirSync(ghostty, { recursive: true });
    writeFileSync(join(ghostty, "config"), "working-directory = /private/path\n");

    await setupGhosttyConfig({ home: sandbox.path });

    const backups = readdirSync(join(sandbox.path, ".config")).filter((name) => name.startsWith("ghostty.backup-"));
    expect(backups).toHaveLength(1);
    expect(readFileSync(join(ghostty, "config"), "utf-8")).not.toContain("working-directory");
    expect(existsSync(join(ghostty, "conf.d", "keybindings.conf"))).toBe(true);
    sandbox.cleanup();
  });

  test("leaves Ghostty config unchanged when initialization is declined", async () => {
    const sandbox = createSandbox();
    const config = join(sandbox.path, ".config", "ghostty", "config");
    mkdirSync(join(sandbox.path, ".config", "ghostty"), { recursive: true });
    writeFileSync(config, "custom = true\n");
    mockConfirm.mockResolvedValue(false);

    expect(await setupGhosttyConfig({ home: sandbox.path })).toBe(false);
    expect(readFileSync(config, "utf-8")).toBe("custom = true\n");
    sandbox.cleanup();
  });
});
