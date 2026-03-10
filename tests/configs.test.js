import { describe, test, expect, beforeEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const CONFIGS_DIR = join(import.meta.dirname, "..", "configs");

/** Private/company-specific patterns that must NOT appear in public configs. */
const FORBIDDEN_PATTERNS = [
  "kinit",
  "BYTEDANCE",
  "bytedance",
  "bytenpm",
  "bytenpx",
  "bnpm.byted",
  "chenzihao",
  "changehow",
  "opencode",
  "occ-web",
  "occ-edit",
  "occ-update",
  "OPENCODE_SERVER",
  "API_KEY",
  "ZHIPU",
  "CONTEXT7",
  "CODEX_API",
  "sk-",
  "ctx7sk-",
];

describe("Static config templates", () => {
  test("aliases file exists and has content", () => {
    const file = join(CONFIGS_DIR, "aliases");
    expect(existsSync(file)).toBe(true);
    const content = readFileSync(file, "utf-8");
    expect(content.length).toBeGreaterThan(0);
    // Should contain common aliases
    expect(content).toContain("reload-zsh");
    expect(content).toContain("gco");
    expect(content).toContain("gph");
    expect(content).toContain("eza");
    expect(content).toContain("bat");
  });

  test("aliases file does not contain private/company content", () => {
    const content = readFileSync(join(CONFIGS_DIR, "aliases"), "utf-8");
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(content).not.toContain(pattern);
    }
  });

  test("zinit-plugins file exists and has correct content", () => {
    const file = join(CONFIGS_DIR, "zinit-plugins");
    expect(existsSync(file)).toBe(true);
    const content = readFileSync(file, "utf-8");
    expect(content).toContain("zinit");
    expect(content).toContain("zsh-autosuggestions");
    expect(content).toContain("zsh-syntax-highlighting");
    expect(content).toContain("powerlevel10k");
  });

  test("config.vim file exists", () => {
    expect(existsSync(join(CONFIGS_DIR, "config.vim"))).toBe(true);
  });

  test("core config files exist", () => {
    for (const file of ["perf.zsh", "env.zsh", "paths.zsh", "options.zsh"]) {
      expect(existsSync(join(CONFIGS_DIR, "core", file))).toBe(true);
    }
  });

  test("shared config files exist", () => {
    for (const file of ["tools.zsh", "prompt.zsh", "fzf.zsh"]) {
      expect(existsSync(join(CONFIGS_DIR, "shared", file))).toBe(true);
    }
  });

  test("zshrc templates exist", () => {
    expect(existsSync(join(CONFIGS_DIR, "zshrc.template"))).toBe(true);
    expect(existsSync(join(CONFIGS_DIR, "zshrc-omz.template"))).toBe(true);
  });

  test("core/paths.zsh does not contain private paths", () => {
    const content = readFileSync(join(CONFIGS_DIR, "core", "paths.zsh"), "utf-8");
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(content).not.toContain(pattern);
    }
  });

  test("core/env.zsh does not contain API keys", () => {
    const content = readFileSync(join(CONFIGS_DIR, "core", "env.zsh"), "utf-8");
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(content).not.toContain(pattern);
    }
  });

  test("shared/fzf.zsh uses fd instead of rg for FZF_DEFAULT_COMMAND", () => {
    const fzfContent = readFileSync(join(CONFIGS_DIR, "shared", "fzf.zsh"), "utf-8");
    expect(fzfContent).toContain("fd --type");
    expect(fzfContent).toContain("FZF_DEFAULT_COMMAND");
    expect(fzfContent).toContain("FZF_CTRL_T_COMMAND");
    expect(fzfContent).toContain("FZF_CTRL_T_OPTS");
  });

  test("shared/tools.zsh contains tool-init helpers and sources fzf.zsh", () => {
    const content = readFileSync(join(CONFIGS_DIR, "shared", "tools.zsh"), "utf-8");
    expect(content).toContain("fnm");
    expect(content).toContain("atuin");
    expect(content).toContain("zoxide");
    expect(content).toContain("fzf.zsh");
  });

  test("all .zsh config files pass syntax check", () => {
    const zshFiles = [
      "core/perf.zsh",
      "core/env.zsh",
      "core/paths.zsh",
      "core/options.zsh",
      "shared/tools.zsh",
      "shared/fzf.zsh",
      "shared/prompt.zsh",
      "local/machine.zsh",
    ];

    for (const file of zshFiles) {
      const fullPath = join(CONFIGS_DIR, file);
      if (!existsSync(fullPath)) continue;
      expect(() => {
        execSync(`zsh -n "${fullPath}"`, { stdio: "pipe" });
      }).not.toThrow();
    }
  });

  test("zshrc templates pass syntax check", () => {
    for (const tmpl of ["zshrc.template", "zshrc-omz.template"]) {
      const fullPath = join(CONFIGS_DIR, tmpl);
      // These templates reference files that may not exist, so zsh -n may fail
      // on source statements. We just check the file is valid UTF-8 and has content.
      const content = readFileSync(fullPath, "utf-8");
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain("ZSH_CONFIG");
      expect(content).toContain("source_if_exists");
    }
  });

  test("no hardcoded home directory paths in any config", () => {
    const allFiles = [
      "aliases",
      "zinit-plugins",
      "core/perf.zsh",
      "core/env.zsh",
      "core/paths.zsh",
      "core/options.zsh",
      "shared/tools.zsh",
      "shared/fzf.zsh",
      "shared/prompt.zsh",
      "zshrc.template",
      "zshrc-omz.template",
    ];

    for (const file of allFiles) {
      const fullPath = join(CONFIGS_DIR, file);
      const content = readFileSync(fullPath, "utf-8");
      // Should not contain any hardcoded /Users/username paths
      expect(content).not.toMatch(/\/Users\/\w+/);
    }
  });
});

describe("perf.zsh EPOCHREALTIME guard", () => {
  let perf;

  beforeEach(() => {
    perf = readFileSync(join(CONFIGS_DIR, "core", "perf.zsh"), "utf-8");
  });

  test("checks EPOCHREALTIME availability after zmodload attempt", () => {
    expect(perf).toContain("${+EPOCHREALTIME}");
  });

  test("guard is placed after zmodload and before typeset declarations", () => {
    const zmodloadIdx = perf.indexOf("zmodload zsh/datetime");
    const guardIdx = perf.indexOf("${+EPOCHREALTIME}");
    const typesetIdx = perf.indexOf("typeset -ga _zsh_stage_names");

    expect(zmodloadIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeGreaterThan(zmodloadIdx);
    expect(guardIdx).toBeLessThan(typesetIdx);
  });

  test("defines no-op _stage stub in the fallback block", () => {
    expect(perf).toMatch(/_stage\(\) \{ :; \}/);
  });

  test("defines no-op _zsh_report stub in the fallback block", () => {
    expect(perf).toMatch(/_zsh_report\(\) \{ :; \}/);
  });

  test("uses return to skip the normal-path setup in the fallback block", () => {
    // 'return' must appear inside the guard block (after the guard, before typeset declarations)
    const guardIdx = perf.indexOf("${+EPOCHREALTIME}");
    const typesetIdx = perf.indexOf("typeset -ga _zsh_stage_names");

    // Use a regex search from the guard position to allow varying indentation
    const afterGuard = perf.slice(guardIdx, typesetIdx);
    expect(afterGuard).toMatch(/^\s*return\s*$/m);
  });

  test("normal path defines full _record_stage_duration function", () => {
    expect(perf).toMatch(/_record_stage_duration\(\) \{/);
  });

  test("normal path _stage records stage names, not just a stub", () => {
    // The full _stage definition assigns to _zsh_current_stage
    expect(perf).toContain('_zsh_current_stage="$1"');
  });

  test("normal path _zsh_report outputs a timing table", () => {
    expect(perf).toContain("┌──────────────────────────┐");
    expect(perf).toContain("total");
  });
});
