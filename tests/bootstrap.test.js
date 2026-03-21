import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@clack/prompts", () => ({
  log: { success: vi.fn(), step: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  select: vi.fn(),
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

import * as p from "@clack/prompts";
import { bootstrap } from "../src/steps/bootstrap.js";
import { commandExists, run, runStream } from "../src/utils/shell.js";

describe("bootstrap step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    p.select.mockResolvedValue("install");
  });

  test("skips Homebrew install when already present", async () => {
    commandExists.mockImplementation((name) => name === "brew" || name === "zsh");
    run.mockImplementation((cmd) => {
      if (cmd.includes("echo $SHELL")) return "/bin/zsh";
      if (cmd.includes("which zsh")) return "/bin/zsh";
      return "";
    });

    await bootstrap({ platform: "darwin" });

    expect(runStream).not.toHaveBeenCalled();
  });

  test("installs Homebrew when not present", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "brew") return false;
      if (name === "zsh") return true;
      return false;
    });
    run.mockImplementation((cmd) => {
      if (cmd.includes("echo $SHELL")) return "/bin/zsh";
      if (cmd.includes("which zsh")) return "/bin/zsh";
      return "";
    });

    await bootstrap({ platform: "darwin" });

    expect(runStream).toHaveBeenCalledWith(expect.stringContaining("Homebrew/install"));
  });

  test("defaults mode installs Homebrew without prompting", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "brew") return false;
      if (name === "zsh") return true;
      return false;
    });
    run.mockImplementation((cmd) => {
      if (cmd.includes("echo $SHELL")) return "/bin/zsh";
      if (cmd.includes("which zsh")) return "/bin/zsh";
      return "";
    });

    await bootstrap({ platform: "darwin", defaults: true });

    expect(p.select).not.toHaveBeenCalled();
    expect(runStream).toHaveBeenCalledWith(expect.stringContaining("Homebrew/install"));
  });

  test("installs Zsh with brew on macOS", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "brew") return true;
      if (name === "zsh") return false;
      return false;
    });

    await bootstrap({ platform: "darwin" });

    expect(runStream).toHaveBeenCalledWith(expect.stringContaining("brew install zsh"));
  });

  test("supports Linux package manager selection", async () => {
    p.select.mockResolvedValue("apt-get");
    commandExists.mockImplementation((name) => {
      if (name === "apt-get") return true;
      if (name === "zsh") return false;
      return false;
    });
    run.mockImplementation((cmd) => {
      if (cmd.includes("echo $SHELL")) return "/bin/zsh";
      if (cmd.includes("which zsh")) return "/bin/zsh";
      return "";
    });

    await bootstrap({ platform: "linux" });

    expect(runStream).toHaveBeenCalledWith(expect.stringContaining("apt-get install -y zsh"));
  });

  test("defaults mode auto-selects the first detected Linux package manager", async () => {
    commandExists.mockImplementation((name) => {
      if (name === "apt-get") return true;
      if (name === "zsh") return false;
      return false;
    });
    run.mockImplementation((cmd) => {
      if (cmd.includes("echo $SHELL")) return "/bin/zsh";
      if (cmd.includes("which zsh")) return "/bin/zsh";
      return "";
    });

    await bootstrap({ platform: "linux", defaults: true });

    expect(p.select).not.toHaveBeenCalled();
    expect(runStream).toHaveBeenCalledWith(expect.stringContaining("apt-get install -y zsh"));
  });

  test("allows skipping package manager setup", async () => {
    p.select.mockResolvedValue("skip");
    commandExists.mockImplementation((name) => {
      if (name === "brew") return false;
      if (name === "zsh") return true;
      return false;
    });
    run.mockImplementation((cmd) => {
      if (cmd.includes("echo $SHELL")) return "/bin/zsh";
      if (cmd.includes("which zsh")) return "/bin/zsh";
      return "";
    });

    await bootstrap({ platform: "darwin" });

    expect(runStream).not.toHaveBeenCalledWith(expect.stringContaining("Homebrew/install"));
  });

  test("sets Zsh as default shell when current shell differs", async () => {
    commandExists.mockReturnValue(true);
    run.mockImplementation((cmd) => {
      if (cmd.includes("echo $SHELL")) return "/bin/bash";
      if (cmd.includes("which zsh")) return "/bin/zsh";
      return "";
    });

    await bootstrap({ platform: "darwin" });

    expect(runStream).toHaveBeenCalledWith(expect.stringContaining("chsh"));
  });

  test("skips chsh when Zsh is already default shell", async () => {
    commandExists.mockReturnValue(true);
    run.mockImplementation((cmd) => {
      if (cmd.includes("echo $SHELL")) return "/bin/zsh";
      if (cmd.includes("which zsh")) return "/bin/zsh";
      return "";
    });

    await bootstrap({ platform: "darwin" });

    expect(runStream).not.toHaveBeenCalledWith(expect.stringContaining("chsh"));
  });
});
