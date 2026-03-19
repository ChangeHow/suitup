import { describe, test, expect } from "vitest";
import { getHelpText, resolveCommand } from "../src/cli-config.js";

describe("cli command resolution", () => {
  test("defaults to setup when no command is provided", () => {
    expect(resolveCommand()).toBe("setup");
  });

  test("maps help flags to help", () => {
    expect(resolveCommand("help")).toBe("help");
    expect(resolveCommand("--help")).toBe("help");
    expect(resolveCommand("-h")).toBe("help");
  });

  test("help text lists help and clean", () => {
    const helpText = getHelpText();

    expect(helpText).toContain("-h, --help");
    expect(helpText).toContain("clean");
  });

  test("help text lists migrate-paths", () => {
    const helpText = getHelpText();
    expect(helpText).toContain("migrate-paths");
  });

  test("resolves migrate-paths command", () => {
    expect(resolveCommand("migrate-paths")).toBe("migrate-paths");
  });
});
