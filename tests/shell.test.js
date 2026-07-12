import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { execSync, spawn } = vi.hoisted(() => ({ execSync: vi.fn(), spawn: vi.fn() }));

vi.mock("node:child_process", () => ({
  execSync,
  spawn,
}));

import { brewInstall, runStream } from "../src/utils/shell.js";

function createChild() {
  const child = new EventEmitter();
  child.kill = vi.fn();
  return child;
}

describe("shell utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("resolves when the command exits successfully", async () => {
    const child = createChild();
    spawn.mockReturnValue(child);

    const promise = runStream("echo ok");
    child.emit("close", 0, null);

    await expect(promise).resolves.toBe(0);
  });

  test("rejects when Ctrl-C interrupts the command", async () => {
    const child = createChild();
    spawn.mockReturnValue(child);

    const promise = runStream("sleep 10");
    child.emit("close", 130, null);

    await expect(promise).rejects.toMatchObject({
      interrupted: true,
      exitCode: 130,
      command: "sleep 10",
    });
  });

  test("installs Homebrew packages without prompting", () => {
    expect(brewInstall("jq")).toBe(true);
    expect(execSync).toHaveBeenCalledWith("env -u HOMEBREW_ASK brew update", { stdio: "inherit" });
    expect(execSync).toHaveBeenCalledWith("brew install --no-ask jq", { stdio: "inherit" });

    expect(brewInstall("ghostty", { cask: true })).toBe(true);
    expect(execSync).toHaveBeenCalledWith("brew install --no-ask --cask ghostty", { stdio: "inherit" });
    expect(execSync.mock.calls.filter(([command]) => command.includes("brew update"))).toHaveLength(1);
  });

  test("propagates Ctrl-C from Homebrew installs", () => {
    execSync.mockImplementation(() => {
      throw Object.assign(new Error("interrupted"), { signal: "SIGINT", status: null });
    });

    expect(() => brewInstall("jq")).toThrow(expect.objectContaining({ interrupted: true }));
  });
});
