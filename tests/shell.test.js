import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, test, vi } from "vitest";

const spawn = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
  spawn,
}));

import { runStream } from "../src/utils/shell.js";

function createChild() {
  const child = new EventEmitter();
  child.kill = vi.fn();
  return child;
}

describe("runStream", () => {
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
});
