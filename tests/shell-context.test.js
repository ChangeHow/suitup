import { describe, test, expect, vi, afterEach } from "vitest";
import { isZshShell, requireZshShell } from "../src/utils/shell-context.js";

describe("shell context helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("detects zsh shell paths", () => {
    expect(isZshShell("/bin/zsh")).toBe(true);
    expect(isZshShell("/opt/homebrew/bin/zsh")).toBe(true);
    expect(isZshShell("/bin/bash")).toBe(false);
  });

  test("requires zsh shell before running a suitup command", () => {
    vi.stubEnv("SHELL", "/bin/bash");
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(requireZshShell("suitup setup")).toBe(false);
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining("must be run from zsh"));
  });

  test("allows suitup commands to run from zsh", () => {
    vi.stubEnv("SHELL", "/bin/zsh");
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(requireZshShell("suitup setup")).toBe(true);
    expect(stderr).not.toHaveBeenCalled();
  });
});
