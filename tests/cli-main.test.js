import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const runSetup = vi.fn();
const runAppend = vi.fn();
const runVerify = vi.fn();
const runClean = vi.fn();
const runMigratePaths = vi.fn();
const requireZshShell = vi.fn(() => true);

vi.mock("../src/utils/node-version.js", () => ({
  checkNodeVersion: vi.fn(),
}));

vi.mock("../src/setup.js", () => ({
  runSetup,
}));

vi.mock("../src/append.js", () => ({
  runAppend,
}));

vi.mock("../src/verify.js", () => ({
  runVerify,
}));

vi.mock("../src/clean.js", () => ({
  runClean,
}));

vi.mock("../src/migrate-paths.js", () => ({
  runMigratePaths,
}));

vi.mock("../src/utils/shell-context.js", () => ({
  requireZshShell,
}));

describe("cli main", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("awaits async setup commands through main()", async () => {
    const { main } = await import("../src/cli.js");

    await main(["node", "src/cli.js", "setup"]);

    expect(requireZshShell).toHaveBeenCalledWith();
    expect(runSetup).toHaveBeenCalledTimes(1);
  });

  test("prints help without invoking async commands", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { main } = await import("../src/cli.js");

    await main(["node", "src/cli.js", "--help"]);

    expect(requireZshShell).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(runSetup).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
