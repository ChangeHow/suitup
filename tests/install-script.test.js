import { describe, test, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const INSTALL_SCRIPT = join(import.meta.dirname, "..", "install.sh");

describe("install.sh", () => {
  test("exists at the repository root", () => {
    expect(existsSync(INSTALL_SCRIPT)).toBe(true);
  });

  test("passes bash syntax check", () => {
    expect(() => {
      execSync(`bash -n "${INSTALL_SCRIPT}"`, { stdio: "pipe" });
    }).not.toThrow();
  });

  test("bootstraps prerequisites, installs dependencies, and launches under zsh", () => {
    const content = readFileSync(INSTALL_SCRIPT, "utf-8");

    expect(content).toContain("https://github.com/${REPO_SLUG}/archive/refs/heads/${SUITUP_REF}.tar.gz");
    expect(content).toContain('ensure_zsh "${PACKAGE_MANAGER}"');
    expect(content).toContain('ensure_node_runtime "${PACKAGE_MANAGER}"');
    expect(content).toContain("npm ci --no-fund --no-audit");
    expect(content).toContain("zsh -lc");
    expect(content).toContain("launch_cli");
  });

  test("defaults to quick init when no command is provided", () => {
    const content = readFileSync(INSTALL_SCRIPT, "utf-8");

    expect(content).toContain('CLI_COMMAND="${1:-init}"');
    expect(content).not.toContain("Choose install mode:");
  });

  test("passes init directly to the CLI and validates supported commands", () => {
    const content = readFileSync(INSTALL_SCRIPT, "utf-8");

    expect(content).toContain('case "${CLI_COMMAND}" in');
    expect(content).toContain('init|setup|append|verify|clean|migrate-paths|help|--help|-h');
    expect(content).toContain('launch_cli "${WORK_DIR}/repo" "${CLI_COMMAND}" "$@"');
  });

  test("prints a helpful error for unknown installer commands", () => {
    const content = readFileSync(INSTALL_SCRIPT, "utf-8");

    expect(content).toContain('Unknown command: ${CLI_COMMAND}');
  });
});
