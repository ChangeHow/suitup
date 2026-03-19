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

  test("downloads the repo archive, installs dependencies, and launches under zsh", () => {
    const content = readFileSync(INSTALL_SCRIPT, "utf-8");

    expect(content).toContain("https://github.com/${REPO_SLUG}/archive/refs/heads/${SUITUP_REF}.tar.gz");
    expect(content).toContain("npm ci --no-fund --no-audit");
    expect(content).toContain("require_cmd zsh");
    expect(content).toContain("zsh -lc");
  });
});
