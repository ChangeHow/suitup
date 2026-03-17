import { describe, test, expect, vi, beforeEach } from "vitest";

const { mockConfirm } = vi.hoisted(() => ({
  mockConfirm: vi.fn(),
}));

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

import { cleanDock } from "../src/steps/dock.js";
import { runStream } from "../src/utils/shell.js";

describe("dock step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("runs dock cleanup when user confirms", async () => {
    mockConfirm.mockResolvedValue(true);

    await cleanDock();

    expect(runStream).toHaveBeenCalledWith(
      expect.stringContaining("defaults write com.apple.dock")
    );
  });

  test("skips dock cleanup when user declines", async () => {
    mockConfirm.mockResolvedValue(false);

    await cleanDock();

    expect(runStream).not.toHaveBeenCalled();
  });

  test("skips dock cleanup when user cancels", async () => {
    const { isCancel } = await import("@clack/prompts");
    isCancel.mockReturnValue(true);
    mockConfirm.mockResolvedValue(undefined);

    await cleanDock();

    expect(runStream).not.toHaveBeenCalled();
  });
});
