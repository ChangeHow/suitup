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
      ".config/zsh/local",
      ".config/zsh/shared/tools",
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
      ["shared/tools/_loader.zsh", ".config/zsh/shared/tools/_loader.zsh"],
      ["shared/tools/fzf.zsh", ".config/zsh/shared/tools/fzf.zsh"],
      ["shared/tools/runtime.zsh", ".config/zsh/shared/tools/runtime.zsh"],
      ["shared/tools/atuin.zsh", ".config/zsh/shared/tools/atuin.zsh"],
      ["shared/tools/bun.zsh", ".config/zsh/shared/tools/bun.zsh"],
      ["shared/completion.zsh", ".config/zsh/shared/completion.zsh"],
      ["shared/highlighting.zsh", ".config/zsh/shared/highlighting.zsh"],
      ["shared/plugins.zsh", ".config/zsh/shared/plugins.zsh"],
      ["shared/aliases.zsh", ".config/zsh/shared/aliases.zsh"],
      ["shared/prompt.zsh", ".config/zsh/shared/prompt.zsh"],
      ["local/machine.zsh", ".config/zsh/local/machine.zsh"],
    ];

    for (const [src, dest] of fileMappings) {
      copyFileSync(join(CONFIGS_DIR, src), join(sandbox, dest));
    }

    // Create .zshrc
    copyFileSync(join(CONFIGS_DIR, "zshrc.template"), join(sandbox, ".zshrc"));

    // Create .zshenv
    copyFileSync(join(CONFIGS_DIR, "zshenv.template"), join(sandbox, ".zshenv"));

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
      ["shared/completion.zsh", ".config/zsh/shared/completion.zsh"],
      ["shared/highlighting.zsh", ".config/zsh/shared/highlighting.zsh"],
      ["shared/plugins.zsh", ".config/zsh/shared/plugins.zsh"],
      ["shared/aliases.zsh", ".config/zsh/shared/aliases.zsh"],
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
