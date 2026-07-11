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
import { brewInstall } from "../src/utils/shell.js";

describe("cli-tools step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("installs or updates every selected tool", async () => {
    await installCliTools(["bat", "eza"]);

    expect(brewInstall).toHaveBeenCalledTimes(2);
    expect(brewInstall).toHaveBeenCalledWith("bat");
    expect(brewInstall).toHaveBeenCalledWith("eza");
  });

  test("continues when a selected tool fails", async () => {
    brewInstall.mockImplementation((name) => name !== "fzf");

    await installCliTools(["fzf", "fd"]);

    expect(brewInstall).toHaveBeenCalledTimes(2);
  });
});
