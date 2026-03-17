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

import { installApps } from "../src/steps/apps.js";
import { brewInstalled, brewInstall } from "../src/utils/shell.js";

describe("apps step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("skips apps that are already installed", async () => {
    brewInstalled.mockReturnValue(true);

    await installApps(["iterm2", "raycast"]);

    expect(brewInstall).not.toHaveBeenCalled();
  });

  test("installs apps that are not present", async () => {
    brewInstalled.mockReturnValue(false);

    await installApps(["iterm2", "visual-studio-code"]);

    expect(brewInstall).toHaveBeenCalledTimes(2);
    expect(brewInstall).toHaveBeenCalledWith("iterm2", { cask: true });
    expect(brewInstall).toHaveBeenCalledWith("visual-studio-code", { cask: true });
  });

  test("mixed: skips installed and installs missing", async () => {
    brewInstalled.mockImplementation((name) => name === "iterm2");

    await installApps(["iterm2", "raycast"]);

    expect(brewInstall).toHaveBeenCalledTimes(1);
    expect(brewInstall).toHaveBeenCalledWith("raycast", { cask: true });
  });
});
