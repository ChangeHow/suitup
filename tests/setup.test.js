import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getDefaultSteps, isZshShell } from "../src/setup.js";

const CONFIGS_DIR = join(import.meta.dirname, "..", "configs");

describe("Setup simulation in sandbox", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), "suitup-setup-"));
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  test("can create full config structure in sandbox", () => {
    // Simulate what setupZshConfig does
    const dirs = [
      ".config/zsh/core",
      ".config/zsh/shared",
      ".config/zsh/local",
      ".config/suitup",
    ];
    for (const dir of dirs) {
      mkdirSync(join(sandbox, dir), { recursive: true });
    }

    // Copy core configs
    for (const file of ["perf.zsh", "env.zsh", "paths.zsh", "options.zsh"]) {
      copyFileSync(
        join(CONFIGS_DIR, "core", file),
        join(sandbox, ".config/zsh/core", file)
      );
    }

    // Copy shared configs
    for (const file of ["tools.zsh", "prompt.zsh"]) {
      copyFileSync(
        join(CONFIGS_DIR, "shared", file),
        join(sandbox, ".config/zsh/shared", file)
      );
    }

    // Copy suitup configs
    copyFileSync(
      join(CONFIGS_DIR, "aliases"),
      join(sandbox, ".config/suitup/aliases")
    );
    copyFileSync(
      join(CONFIGS_DIR, "zinit-plugins"),
      join(sandbox, ".config/suitup/zinit-plugins")
    );

    // Copy .zshrc
    copyFileSync(
      join(CONFIGS_DIR, "zshrc.template"),
      join(sandbox, ".zshrc")
    );

    // Verify all expected files exist
    const expectedFiles = [
      ".zshrc",
      ".config/zsh/core/perf.zsh",
      ".config/zsh/core/env.zsh",
      ".config/zsh/core/paths.zsh",
      ".config/zsh/core/options.zsh",
      ".config/zsh/shared/tools.zsh",
      ".config/zsh/shared/prompt.zsh",
      ".config/suitup/aliases",
      ".config/suitup/zinit-plugins",
    ];

    for (const file of expectedFiles) {
      expect(existsSync(join(sandbox, file))).toBe(true);
    }
  });

  test("zshrc template has correct structure", () => {
    const content = readFileSync(join(CONFIGS_DIR, "zshrc.template"), "utf-8");

    // Should have the orchestration structure
    expect(content).toContain('export ZSH_CONFIG="$HOME/.config/zsh"');
    expect(content).toContain("source_if_exists");
    expect(content).toContain("core/perf.zsh");
    expect(content).toContain("core/env.zsh");
    expect(content).toContain("core/paths.zsh");
    expect(content).toContain("core/options.zsh");
    expect(content).toContain("shared/tools.zsh");
    expect(content).toContain("zinit");
    expect(content).toContain("suitup/zinit-plugins");
    expect(content).toContain("suitup/aliases");
    expect(content).toContain("shared/prompt.zsh");
    expect(content).toContain("_zsh_report");
    expect(content).toContain('source_if_exists "${ZINIT_HOME}/zinit.zsh"');

    // prompt.zsh (which loads p10k last) must come after zinit-plugins
    const pluginsIdx = content.indexOf("suitup/zinit-plugins");
    const promptIdx = content.indexOf("shared/prompt.zsh");
    const reportIdx = content.indexOf("_zsh_report");
    expect(pluginsIdx).toBeLessThan(promptIdx);
    expect(promptIdx).toBeLessThan(reportIdx);
  });

  test("detects whether the current shell is zsh", () => {
    expect(isZshShell("/bin/zsh")).toBe(true);
    expect(isZshShell("/opt/homebrew/bin/zsh")).toBe(true);
    expect(isZshShell("/bin/bash")).toBe(false);
  });

  test("does not preselect GUI Apps on Linux", () => {
    expect(getDefaultSteps("linux")).not.toContain("apps");
    expect(getDefaultSteps("darwin")).toContain("apps");
  });

  test("aliases file uses $HOME or ~ instead of hardcoded paths", () => {
    const content = readFileSync(join(CONFIGS_DIR, "aliases"), "utf-8");

    // Should use ~ or $HOME, not /Users/something
    expect(content).toContain("~/.zshrc");
    expect(content).not.toMatch(/\/Users\/\w+/);
  });

  test("tools.zsh uses fnm instead of volta", () => {
    const content = readFileSync(
      join(CONFIGS_DIR, "shared", "tools.zsh"),
      "utf-8"
    );

    expect(content).toContain("fnm");
    expect(content).not.toContain("volta");
  });

  test("tools.zsh uses zoxide instead of autojump", () => {
    const content = readFileSync(
      join(CONFIGS_DIR, "shared", "tools.zsh"),
      "utf-8"
    );

    expect(content).toContain("zoxide");
    expect(content).not.toContain("autojump");
  });
});
