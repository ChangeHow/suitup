import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  copyFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { verifySandbox } from "../src/verify.js";

const CONFIGS_DIR = join(import.meta.dirname, "..", "configs");

describe("Verify in sandbox", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), "suitup-verify-"));
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  test("empty sandbox reports all configs missing", () => {
    const results = verifySandbox(sandbox);
    expect(results.configs.every((c) => !c.ok)).toBe(true);
  });

  test("populated sandbox reports all configs present", () => {
    // Create the expected structure
    const dirs = [
      ".config/zsh/core",
      ".config/zsh/shared",
      ".config/suitup",
    ];
    for (const dir of dirs) {
      mkdirSync(join(sandbox, dir), { recursive: true });
    }

    // Copy config files
    const fileMappings = [
      ["core/perf.zsh", ".config/zsh/core/perf.zsh"],
      ["core/env.zsh", ".config/zsh/core/env.zsh"],
      ["core/paths.zsh", ".config/zsh/core/paths.zsh"],
      ["core/options.zsh", ".config/zsh/core/options.zsh"],
      ["shared/tools.zsh", ".config/zsh/shared/tools.zsh"],
      ["shared/prompt.zsh", ".config/zsh/shared/prompt.zsh"],
      ["aliases", ".config/suitup/aliases"],
      ["zinit-plugins", ".config/suitup/zinit-plugins"],
    ];

    for (const [src, dest] of fileMappings) {
      copyFileSync(join(CONFIGS_DIR, src), join(sandbox, dest));
    }

    // Create .zshrc
    copyFileSync(join(CONFIGS_DIR, "zshrc.template"), join(sandbox, ".zshrc"));

    const results = verifySandbox(sandbox);
    expect(results.configs.every((c) => c.ok)).toBe(true);
  });

  test("zsh syntax check passes for all config files", () => {
    const dirs = [
      ".config/zsh/core",
      ".config/zsh/shared",
    ];
    for (const dir of dirs) {
      mkdirSync(join(sandbox, dir), { recursive: true });
    }

    const zshFiles = [
      ["core/perf.zsh", ".config/zsh/core/perf.zsh"],
      ["core/env.zsh", ".config/zsh/core/env.zsh"],
      ["core/paths.zsh", ".config/zsh/core/paths.zsh"],
      ["core/options.zsh", ".config/zsh/core/options.zsh"],
      ["shared/prompt.zsh", ".config/zsh/shared/prompt.zsh"],
    ];

    for (const [src, dest] of zshFiles) {
      copyFileSync(join(CONFIGS_DIR, src), join(sandbox, dest));
    }

    const results = verifySandbox(sandbox);
    expect(results.syntax.length).toBeGreaterThan(0);
    expect(results.syntax.every((s) => s.ok)).toBe(true);
  });

  test("syntax check detects invalid zsh file", () => {
    mkdirSync(join(sandbox, ".config/zsh/core"), { recursive: true });

    // Write an invalid zsh file
    writeFileSync(
      join(sandbox, ".config/zsh/core/env.zsh"),
      'if [[ "unclosed\n',
      "utf-8"
    );

    const results = verifySandbox(sandbox);
    const envCheck = results.syntax.find((s) => s.file.includes("env.zsh"));
    expect(envCheck).toBeDefined();
    expect(envCheck.ok).toBe(false);
  });
});
