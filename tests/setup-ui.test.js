import { describe, test, expect, vi, beforeEach } from "vitest";

const { mockNote, mockIntro, mockOutro, mockError, mockInfo } = vi.hoisted(() => ({
  mockNote: vi.fn(),
  mockIntro: vi.fn(),
  mockOutro: vi.fn(),
  mockError: vi.fn(),
  mockInfo: vi.fn(),
}));

vi.mock("@clack/prompts", () => ({
  note: mockNote,
  intro: mockIntro,
  outro: mockOutro,
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
  multiselect: vi.fn(),
  select: vi.fn(),
  groupMultiselect: vi.fn(),
  confirm: vi.fn(),
  text: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  log: {
    success: vi.fn(),
    step: vi.fn(),
    warn: vi.fn(),
    error: mockError,
    info: mockInfo,
  },
}));

vi.mock("../src/utils/shell-context.js", () => ({
  isZshShell: vi.fn(() => false),
}));

import { runSetup, getWelcomeMessage } from "../src/setup.js";

describe("setup welcome UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders the welcome art inside a boxed note before shell validation", async () => {
    await runSetup();

    expect(mockNote).toHaveBeenCalledWith(getWelcomeMessage(), "Welcome");
    expect(mockIntro).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith("Suitup setup must be run from zsh.");
    expect(mockInfo).toHaveBeenCalledWith(
      'Switch to zsh first: run `zsh` for this session or `chsh -s "$(which zsh)"` to make it your default shell.'
    );
    expect(mockOutro).toHaveBeenCalledWith("No changes made.");
  });
});
