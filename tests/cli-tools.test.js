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

import { installCliTools } from "../src/steps/cli-tools.js";
import { brewInstalled, brewInstall } from "../src/utils/shell.js";

describe("cli-tools step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("skips tools that are already installed", async () => {
    brewInstalled.mockReturnValue(true);

    await installCliTools(["bat", "eza", "fzf"]);

    expect(brewInstall).not.toHaveBeenCalled();
  });

  test("installs tools that are not present", async () => {
    brewInstalled.mockReturnValue(false);

    await installCliTools(["bat", "eza"]);

    expect(brewInstall).toHaveBeenCalledTimes(2);
    expect(brewInstall).toHaveBeenCalledWith("bat");
    expect(brewInstall).toHaveBeenCalledWith("eza");
  });

  test("mixed: skips installed and installs missing", async () => {
    brewInstalled.mockImplementation((name) => name === "bat");

    await installCliTools(["bat", "fzf", "fd"]);

    expect(brewInstall).toHaveBeenCalledTimes(2);
    expect(brewInstall).toHaveBeenCalledWith("fzf");
    expect(brewInstall).toHaveBeenCalledWith("fd");
    expect(brewInstall).not.toHaveBeenCalledWith("bat");
  });
});
