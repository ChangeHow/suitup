import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createSandbox } from "./helpers.js";
import {
  detectCompletedSteps,
  getDefaultSteps,
  getInitialStepValues,
  getRecommendedAppValues,
  getRecommendedCliToolValues,
  getWelcomeMessage,
  isZshShell,
} from "../src/setup.js";

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
      ".config/zsh/shared/tools",
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
    for (const file of ["tools.zsh", "prompt.zsh", "completion.zsh", "highlighting.zsh", "aliases.zsh", "plugins.zsh"]) {
      copyFileSync(
        join(CONFIGS_DIR, "shared", file),
        join(sandbox, ".config/zsh/shared", file)
      );
    }

    // Copy shared/tools configs
    for (const file of ["_loader.zsh", "fzf.zsh", "runtime.zsh", "atuin.zsh", "bun.zsh"]) {
      copyFileSync(
        join(CONFIGS_DIR, "shared", "tools", file),
        join(sandbox, ".config/zsh/shared/tools", file)
      );
    }

    copyFileSync(
      join(CONFIGS_DIR, "local", "machine.zsh"),
      join(sandbox, ".config/zsh/local", "machine.zsh")
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
      ".config/zsh/shared/tools/_loader.zsh",
      ".config/zsh/shared/tools/fzf.zsh",
      ".config/zsh/shared/tools/runtime.zsh",
      ".config/zsh/shared/tools/atuin.zsh",
      ".config/zsh/shared/tools/bun.zsh",
      ".config/zsh/shared/completion.zsh",
      ".config/zsh/shared/highlighting.zsh",
      ".config/zsh/shared/aliases.zsh",
      ".config/zsh/shared/plugins.zsh",
      ".config/zsh/shared/prompt.zsh",
      ".config/zsh/local/machine.zsh",
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
    expect(content).toContain("shared/plugins.zsh");
    expect(content).toContain("shared/highlighting.zsh");
    expect(content).toContain("shared/aliases.zsh");
    expect(content).toContain("shared/completion.zsh");
    expect(content).toContain("shared/prompt.zsh");
    expect(content).toContain("_zsh_report");
    expect(content).toContain('source_if_exists "${ZINIT_HOME}/zinit.zsh"');

    const pluginsIdx = content.indexOf("shared/plugins.zsh");
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

  test("quick init uses recommended CLI tools only", () => {
    expect(getRecommendedCliToolValues()).toEqual([
      "bat",
      "eza",
      "fzf",
      "fd",
      "atuin",
      "zoxide",
      "ripgrep",
    ]);
  });

  test("quick init uses recommended GUI apps only", () => {
    expect(getRecommendedAppValues()).toEqual([
      "iterm2",
      "raycast",
      "visual-studio-code",
    ]);
  });

  test("welcome message includes the ASCII suitup mark", () => {
    const message = getWelcomeMessage();

    expect(message).toContain("_____       _ __");
    expect(message).toContain("/ ___/__  __(_) /___  ______");
    expect(message).toContain("/____/\\__,_/_/\\__/\\__,_/ .___/");
    expect(message).toContain("Suit up!");
  });

  test("detects completed suitup-managed setup steps", () => {
    mkdirSync(join(sandbox, ".config", "zsh", "core"), { recursive: true });
    mkdirSync(join(sandbox, ".config", "zsh", "shared"), { recursive: true });
    mkdirSync(join(sandbox, ".config", "zsh", "local"), { recursive: true });
    mkdirSync(join(sandbox, ".config", "zsh", "shared", "tools"), { recursive: true });
    mkdirSync(join(sandbox, ".local", "share", "zinit", "zinit.git"), { recursive: true });

    writeFileSync(join(sandbox, ".zshrc"), "# Generated by suitup\n", "utf-8");
    writeFileSync(join(sandbox, ".zshenv"), "# Generated by suitup\n", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "core", "perf.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "core", "env.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "core", "paths.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "core", "options.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "tools.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "tools", "_loader.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "completion.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "highlighting.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "plugins.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "aliases.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "prompt.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "local", "machine.zsh"), "", "utf-8");

    const detected = detectCompletedSteps({
      home: sandbox,
      platform: "darwin",
      commandExistsFn(name) {
        return ["zsh", "brew", "fnm", "node", "pnpm", "git-cz"].includes(name);
      },
    });

    expect(detected).toEqual(expect.arrayContaining([
      "bootstrap",
      "zsh-config",
      "plugins",
      "aliases",
      "frontend",
    ]));
  });

  test("removes completed steps from initial setup selections", () => {
    const completedSandbox = createSandbox();
    try {
      mkdirSync(join(completedSandbox.path, ".config", "zsh", "core"), { recursive: true });
      mkdirSync(join(completedSandbox.path, ".config", "zsh", "shared"), { recursive: true });
      mkdirSync(join(completedSandbox.path, ".config", "zsh", "local"), { recursive: true });
      mkdirSync(join(completedSandbox.path, ".config", "zsh", "shared", "tools"), { recursive: true });

      writeFileSync(join(completedSandbox.path, ".zshrc"), "# Generated by suitup\n", "utf-8");
      writeFileSync(join(completedSandbox.path, ".zshenv"), "# Generated by suitup\n", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "core", "perf.zsh"), "", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "core", "env.zsh"), "", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "core", "paths.zsh"), "", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "core", "options.zsh"), "", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "shared", "tools.zsh"), "", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "shared", "tools", "_loader.zsh"), "", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "shared", "completion.zsh"), "", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "shared", "highlighting.zsh"), "", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "shared", "prompt.zsh"), "", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "local", "machine.zsh"), "", "utf-8");
      writeFileSync(join(completedSandbox.path, ".config", "zsh", "shared", "aliases.zsh"), "", "utf-8");

      const initialSteps = getInitialStepValues({
        home: completedSandbox.path,
        platform: "darwin",
        commandExistsFn(name) {
          return ["zsh", "brew"].includes(name);
        },
      });

      expect(initialSteps).not.toContain("bootstrap");
      expect(initialSteps).not.toContain("zsh-config");
      expect(initialSteps).not.toContain("aliases");
      expect(initialSteps).toContain("frontend");
    } finally {
      completedSandbox.cleanup();
    }
  });

  test("does not treat non-suitup shell files as completed zsh config", () => {
    mkdirSync(join(sandbox, ".config", "zsh", "core"), { recursive: true });
    mkdirSync(join(sandbox, ".config", "zsh", "shared"), { recursive: true });
    mkdirSync(join(sandbox, ".config", "zsh", "local"), { recursive: true });
    mkdirSync(join(sandbox, ".config", "zsh", "shared", "tools"), { recursive: true });

    writeFileSync(join(sandbox, ".zshrc"), "# user managed\n", "utf-8");
    writeFileSync(join(sandbox, ".zshenv"), "# user managed\n", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "core", "perf.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "core", "env.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "core", "paths.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "core", "options.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "tools.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "tools", "_loader.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "completion.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "highlighting.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "shared", "prompt.zsh"), "", "utf-8");
    writeFileSync(join(sandbox, ".config", "zsh", "local", "machine.zsh"), "", "utf-8");

    const detected = detectCompletedSteps({
      home: sandbox,
      platform: "darwin",
      commandExistsFn(name) {
        return ["zsh", "brew"].includes(name);
      },
    });

    expect(detected).not.toContain("zsh-config");
  });

  test("aliases file uses $HOME or ~ instead of hardcoded paths", () => {
    const content = readFileSync(join(CONFIGS_DIR, "shared", "aliases.zsh"), "utf-8");

    // Should use ~ or $HOME, not /Users/something
    expect(content).toContain("~/.zshrc");
    expect(content).not.toMatch(/\/Users\/\w+/);
  });

  test("tools.zsh orchestrator loads runtime.zsh which uses fnm", () => {
    const content = readFileSync(
      join(CONFIGS_DIR, "shared", "tools.zsh"),
      "utf-8"
    );

    expect(content).toContain("_load_tool_config");
    expect(content).toContain("runtime");
    expect(content).not.toContain("volta");

    const runtime = readFileSync(
      join(CONFIGS_DIR, "shared", "tools", "runtime.zsh"),
      "utf-8"
    );
    expect(runtime).toContain("fnm");
  });

  test("tools.zsh orchestrator loads runtime.zsh which uses zoxide", () => {
    const content = readFileSync(
      join(CONFIGS_DIR, "shared", "tools.zsh"),
      "utf-8"
    );

    expect(content).toContain("_load_tool_config");
    expect(content).not.toContain("autojump");

    const runtime = readFileSync(
      join(CONFIGS_DIR, "shared", "tools", "runtime.zsh"),
      "utf-8"
    );
    expect(runtime).toContain("zoxide");
  });
});
