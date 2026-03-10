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
  });

  test("omz template has Oh My Zsh structure", () => {
    const content = readFileSync(
      join(CONFIGS_DIR, "zshrc-omz.template"),
      "utf-8"
    );

    expect(content).toContain('export ZSH="$HOME/.oh-my-zsh"');
    expect(content).toContain("oh-my-zsh.sh");
    expect(content).toContain("powerlevel10k");
    expect(content).toContain("plugins=(");
    // OMZ template should NOT have zinit references
    expect(content).not.toContain("zinit.zsh");
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
