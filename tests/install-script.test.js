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

  test("downloads the repo archive, installs dependencies, and launches under zsh with terminal input", () => {
    const content = readFileSync(INSTALL_SCRIPT, "utf-8");

    expect(content).toContain("https://github.com/${REPO_SLUG}/archive/refs/heads/${SUITUP_REF}.tar.gz");
    expect(content).toContain("npm ci --no-fund --no-audit");
    expect(content).toContain("require_cmd zsh");
    expect(content).toContain("zsh -lc");
    expect(content).toContain("< /dev/tty");
  });

  test("prompts for init or append mode before launching when no command is provided", () => {
    const content = readFileSync(INSTALL_SCRIPT, "utf-8");

    expect(content).toContain("Choose install mode:");
    expect(content).toContain("1) init");
    expect(content).toContain("2) append");
    expect(content).toContain('CLI_COMMAND="${1:-}"');
    expect(content).toContain('read -r -p "Select [1-2] (default 1): " INSTALL_MODE < /dev/tty');
  });

  test("maps init to setup and forwards the selected command to the CLI", () => {
    const content = readFileSync(INSTALL_SCRIPT, "utf-8");

    expect(content).toContain('if [[ "${CLI_COMMAND}" == "init" ]]; then');
    expect(content).toContain('CLI_COMMAND="setup"');
    expect(content).toContain('"${CLI_COMMAND}" "$@" < /dev/tty');
  });

  test("prints a helpful error for invalid installer mode selections", () => {
    const content = readFileSync(INSTALL_SCRIPT, "utf-8");

    expect(content).toContain('Please enter 1 for init or 2 for append.');
  });
});
