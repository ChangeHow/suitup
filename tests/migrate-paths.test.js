import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createSandbox } from "./helpers.js";

vi.mock("@clack/prompts", () => ({
  log: { success: vi.fn(), step: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  confirm: vi.fn(),
  text: vi.fn(),
  isCancel: vi.fn(() => false),
}));

import { extractPathLines, migratePaths } from "../src/steps/migrate-paths.js";

// ---------------------------------------------------------------------------
// extractPathLines — pattern coverage
// ---------------------------------------------------------------------------
describe("extractPathLines", () => {
  test("extracts 'export PATH=...' lines", () => {
    const content = [
      '#!/bin/zsh',
      'echo "hello"',
      'export PATH="$HOME/bin:$PATH"',
      'alias ll="ls -la"',
    ].join("\n");

    const { pathLines, remainingLines } = extractPathLines(content);
    expect(pathLines).toEqual(['export PATH="$HOME/bin:$PATH"']);
    expect(remainingLines.join("\n")).not.toContain("export PATH=");
  });

  test("extracts 'PATH=' without export keyword", () => {
    const content = 'PATH="$HOME/bin:$PATH"\necho foo';
    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual(['PATH="$HOME/bin:$PATH"']);
  });

  test("extracts 'path+=()' zsh array syntax", () => {
    const content = "path+=('/usr/local/go/bin')\necho foo";
    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual(["path+=('/usr/local/go/bin')"]);
  });

  test("extracts 'path=()' zsh array syntax", () => {
    const content = "path=('/usr/local/go/bin' $path)\necho foo";
    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual(["path=('/usr/local/go/bin' $path)"]);
  });

  test("extracts brew shellenv eval", () => {
    const content = 'eval "$(/opt/homebrew/bin/brew shellenv)"\necho foo';
    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual(['eval "$(/opt/homebrew/bin/brew shellenv)"']);
  });

  test("extracts cargo env source", () => {
    const content = '. "$HOME/.cargo/env"\necho foo';
    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual(['. "$HOME/.cargo/env"']);
  });

  test("extracts source ~/.cargo/env", () => {
    const content = 'source "$HOME/.cargo/env"\necho foo';
    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual(['source "$HOME/.cargo/env"']);
  });

  test("extracts GOPATH and associated PATH lines", () => {
    const content = [
      'export GOPATH="$HOME/go"',
      'export PATH="$GOPATH/bin:$PATH"',
      'echo "Go configured"',
    ].join("\n");

    const { pathLines } = extractPathLines(content);
    expect(pathLines).toContain('export GOPATH="$HOME/go"');
    expect(pathLines).toContain('export PATH="$GOPATH/bin:$PATH"');
    expect(pathLines.length).toBe(2);
  });

  test("extracts NVM initialization lines", () => {
    const content = [
      'export NVM_DIR="$HOME/.nvm"',
      '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"',
      'echo "done"',
    ].join("\n");

    const { pathLines } = extractPathLines(content);
    expect(pathLines).toContain('export NVM_DIR="$HOME/.nvm"');
    expect(pathLines).toContain('[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"');
  });

  test("extracts bun initialization lines", () => {
    const content = [
      'export BUN_INSTALL="$HOME/.bun"',
      'export PATH="$BUN_INSTALL/bin:$PATH"',
      '[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"',
    ].join("\n");

    const { pathLines } = extractPathLines(content);
    expect(pathLines.length).toBe(3);
  });

  test("extracts pyenv init lines", () => {
    const content = [
      'export PYENV_ROOT="$HOME/.pyenv"',
      'eval "$(pyenv init --path)"',
      'eval "$(pyenv init -)"',
      'echo "done"',
    ].join("\n");

    const { pathLines } = extractPathLines(content);
    expect(pathLines).toContain('export PYENV_ROOT="$HOME/.pyenv"');
    expect(pathLines).toContain('eval "$(pyenv init --path)"');
    expect(pathLines).toContain('eval "$(pyenv init -)"');
  });

  test("extracts PNPM_HOME and associated PATH", () => {
    const content = [
      'export PNPM_HOME="$HOME/.local/share/pnpm"',
      'export PATH="$PNPM_HOME:$PATH"',
    ].join("\n");

    const { pathLines } = extractPathLines(content);
    expect(pathLines.length).toBe(2);
  });

  test("extracts DENO_INSTALL and associated PATH", () => {
    const content = [
      'export DENO_INSTALL="$HOME/.deno"',
      'export PATH="$DENO_INSTALL/bin:$PATH"',
    ].join("\n");

    const { pathLines } = extractPathLines(content);
    expect(pathLines.length).toBe(2);
  });

  test("extracts Android SDK paths", () => {
    const content = [
      'export ANDROID_HOME="$HOME/Android/Sdk"',
      'export PATH="$PATH:$ANDROID_HOME/emulator"',
      'export PATH="$PATH:$ANDROID_HOME/platform-tools"',
    ].join("\n");

    const { pathLines } = extractPathLines(content);
    expect(pathLines.length).toBe(3);
  });

  test("extracts JAVA_HOME", () => {
    const content = 'export JAVA_HOME="/usr/lib/jvm/java-17"\nexport PATH="$JAVA_HOME/bin:$PATH"';
    const { pathLines } = extractPathLines(content);
    expect(pathLines.length).toBe(2);
  });

  test("extracts FNM_DIR and fnm env eval", () => {
    const content = [
      'export FNM_DIR="$HOME/.fnm"',
      'eval "$(fnm env --use-on-cd)"',
    ].join("\n");

    const { pathLines } = extractPathLines(content);
    expect(pathLines.length).toBe(2);
  });

  test("extracts rbenv init", () => {
    const content = 'eval "$(rbenv init -)"';
    const { pathLines } = extractPathLines(content);
    expect(pathLines.length).toBe(1);
  });

  test("extracts mise/rtx init", () => {
    const content = 'eval "$(mise init zsh)"';
    const { pathLines } = extractPathLines(content);
    expect(pathLines.length).toBe(1);
  });

  test("extracts ghcup env source", () => {
    const content = 'source "$HOME/.ghcup/env"';
    const { pathLines } = extractPathLines(content);
    expect(pathLines.length).toBe(1);
  });

  test("extracts typeset -U path", () => {
    const content = "typeset -U path\necho foo";
    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual(["typeset -U path"]);
  });

  test("includes associated comment above path line", () => {
    const content = [
      "# Added by cargo installer",
      '. "$HOME/.cargo/env"',
      'echo "done"',
    ].join("\n");

    const { pathLines } = extractPathLines(content);
    expect(pathLines).toContain("# Added by cargo installer");
    expect(pathLines).toContain('. "$HOME/.cargo/env"');
  });

  test("does not migrate lines inside suitup blocks", () => {
    const content = [
      "# >>> suitup/tools-init >>>",
      'export PATH="$HOME/.suitup/bin:$PATH"',
      "# <<< suitup/tools-init <<<",
      'export PATH="$HOME/bin:$PATH"',
    ].join("\n");

    const { pathLines, remainingLines } = extractPathLines(content);
    expect(pathLines).toEqual(['export PATH="$HOME/bin:$PATH"']);
    expect(remainingLines.join("\n")).toContain("suitup/tools-init");
  });

  test("does not migrate suitup orchestration source lines", () => {
    const content = [
      'source "$ZSH_CONFIG/core/paths.zsh"',
      'export PATH="$HOME/bin:$PATH"',
    ].join("\n");

    const { pathLines, remainingLines } = extractPathLines(content);
    expect(pathLines).toEqual(['export PATH="$HOME/bin:$PATH"']);
    expect(remainingLines.join("\n")).toContain('source "$ZSH_CONFIG/core/paths.zsh"');
  });

  test("does not migrate source $HOME/.config/zsh lines", () => {
    const content = [
      'source "$HOME/.config/zsh/core/paths.zsh"',
      'export PATH="$HOME/bin:$PATH"',
    ].join("\n");

    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual(['export PATH="$HOME/bin:$PATH"']);
  });

  test("returns empty pathLines when no path-related lines exist", () => {
    const content = 'echo "hello"\nalias ll="ls -la"\nexport FOO=bar';
    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual([]);
  });

  test("does not match non-path env vars", () => {
    const content = 'export FOO=bar\nexport EDITOR=vim\nexport TERM=xterm-256color';
    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual([]);
  });

  test("does not match CUSTOM_PATH= (only exact PATH)", () => {
    const content = "CUSTOM_PATH=/some/path\nMY_PATH=/other";
    const { pathLines } = extractPathLines(content);
    expect(pathLines).toEqual([]);
  });

  test("handles backslash continuations", () => {
    const content = [
      'export PATH="$HOME/bin:\\',
      "  $HOME/.local/bin:\\",
      '  $PATH"',
      'echo "done"',
    ].join("\n");

    const { pathLines, remainingLines } = extractPathLines(content);
    expect(pathLines).toEqual([
      'export PATH="$HOME/bin:\\',
      "  $HOME/.local/bin:\\",
      '  $PATH"',
    ]);
    expect(remainingLines.join("\n")).toContain('echo "done"');
  });

  test("handles multiple PATH lines interspersed with other content", () => {
    const content = [
      'export PATH="$HOME/bin:$PATH"',
      'alias ll="ls -la"',
      'export GOPATH="$HOME/go"',
      "export FOO=bar",
      'export PATH="$GOPATH/bin:$PATH"',
    ].join("\n");

    const { pathLines, remainingLines } = extractPathLines(content);
    expect(pathLines.length).toBe(3);
    expect(remainingLines.join("\n")).toContain("alias ll=");
    expect(remainingLines.join("\n")).toContain("export FOO=bar");
  });

  test("cleans up consecutive blank lines after removal", () => {
    const content = [
      'echo "start"',
      "",
      'export PATH="$HOME/bin:$PATH"',
      "",
      'echo "end"',
    ].join("\n");

    const { remainingLines } = extractPathLines(content);
    const joined = remainingLines.join("\n");
    // Should not have three consecutive newlines (double blank)
    expect(joined).not.toMatch(/\n\n\n/);
    // Should preserve exactly one blank line between start and end
    expect(joined).toBe('echo "start"\n\necho "end"');
  });

  test("realistic multi-tool zshrc", () => {
    const content = [
      "# My zshrc",
      'source "$ZSH_CONFIG/core/paths.zsh"',
      "",
      "# >>> suitup/aliases >>>",
      'source "$HOME/.config/suitup/aliases"',
      "# <<< suitup/aliases <<<",
      "",
      "# Added by Rust installer",
      '. "$HOME/.cargo/env"',
      "",
      'export GOPATH="$HOME/go"',
      'export PATH="$GOPATH/bin:$PATH"',
      "",
      'export NVM_DIR="$HOME/.nvm"',
      '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"',
      "",
      'export BUN_INSTALL="$HOME/.bun"',
      'export PATH="$BUN_INSTALL/bin:$PATH"',
      "",
      'export PNPM_HOME="$HOME/.local/share/pnpm"',
      'export PATH="$PNPM_HOME:$PATH"',
      "",
      "alias ll='ls -la'",
      "export EDITOR=vim",
    ].join("\n");

    const { pathLines, remainingLines } = extractPathLines(content);

    // Should extract all path-related lines (including associated comments)
    expect(pathLines).toContain("# Added by Rust installer");
    expect(pathLines).toContain('. "$HOME/.cargo/env"');
    expect(pathLines).toContain('export GOPATH="$HOME/go"');
    expect(pathLines).toContain('export PATH="$GOPATH/bin:$PATH"');
    expect(pathLines).toContain('export NVM_DIR="$HOME/.nvm"');
    expect(pathLines).toContain('[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"');
    expect(pathLines).toContain('export BUN_INSTALL="$HOME/.bun"');
    expect(pathLines).toContain('export PATH="$BUN_INSTALL/bin:$PATH"');
    expect(pathLines).toContain('export PNPM_HOME="$HOME/.local/share/pnpm"');
    expect(pathLines).toContain('export PATH="$PNPM_HOME:$PATH"');

    // Should keep non-path lines
    const remaining = remainingLines.join("\n");
    expect(remaining).toContain('source "$ZSH_CONFIG/core/paths.zsh"');
    expect(remaining).toContain("suitup/aliases");
    expect(remaining).toContain("alias ll=");
    expect(remaining).toContain("export EDITOR=vim");
  });
});

// ---------------------------------------------------------------------------
// migratePaths — integration tests
// ---------------------------------------------------------------------------
describe("migratePaths", () => {
  let sandbox;

  beforeEach(() => {
    vi.clearAllMocks();
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.cleanup();
  });

  test("migrates path lines from .zshrc to paths.zsh", async () => {
    writeFileSync(
      join(sandbox.path, ".zshrc"),
      ['#!/bin/zsh', 'echo "hello"', 'export PATH="$HOME/bin:$PATH"', 'alias ll="ls -la"'].join(
        "\n"
      )
    );

    mkdirSync(join(sandbox.path, ".config", "zsh", "core"), { recursive: true });
    writeFileSync(
      join(sandbox.path, ".config", "zsh", "core", "paths.zsh"),
      "# PATH configuration\n"
    );

    const result = await migratePaths({ home: sandbox.path });

    expect(result.migrated).toBe(1);

    const zshrc = readFileSync(join(sandbox.path, ".zshrc"), "utf-8");
    expect(zshrc).not.toContain("export PATH=");
    expect(zshrc).toContain('echo "hello"');

    const paths = readFileSync(join(sandbox.path, ".config", "zsh", "core", "paths.zsh"), "utf-8");
    expect(paths).toContain('export PATH="$HOME/bin:$PATH"');
    expect(paths).toContain("migrated from .zshrc by suitup");
  });

  test("returns migrated=0 when no path lines exist", async () => {
    writeFileSync(join(sandbox.path, ".zshrc"), 'echo "hello"\nalias ll="ls -la"');

    const result = await migratePaths({ home: sandbox.path });
    expect(result.migrated).toBe(0);
  });

  test("creates backup before migration", async () => {
    writeFileSync(join(sandbox.path, ".zshrc"), 'export PATH="$HOME/bin:$PATH"');
    mkdirSync(join(sandbox.path, ".config", "zsh", "core"), { recursive: true });
    writeFileSync(join(sandbox.path, ".config", "zsh", "core", "paths.zsh"), "# paths\n");

    const result = await migratePaths({ home: sandbox.path });

    expect(result.backupDir).toBeDefined();
    expect(existsSync(join(result.backupDir, ".zshrc"))).toBe(true);
  });

  test("throws when .zshrc does not exist", async () => {
    await expect(migratePaths({ home: sandbox.path })).rejects.toThrow(".zshrc not found");
  });

  test("dry run does not modify files", async () => {
    const originalContent = 'export PATH="$HOME/bin:$PATH"\nalias ll="ls -la"';
    writeFileSync(join(sandbox.path, ".zshrc"), originalContent);

    const result = await migratePaths({ home: sandbox.path, dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.migrated).toBe(1);
    expect(readFileSync(join(sandbox.path, ".zshrc"), "utf-8")).toBe(originalContent);
  });

  test("creates paths.zsh if it does not exist", async () => {
    writeFileSync(join(sandbox.path, ".zshrc"), 'export PATH="$HOME/bin:$PATH"');

    const result = await migratePaths({ home: sandbox.path });

    expect(result.migrated).toBe(1);
    expect(existsSync(join(sandbox.path, ".config", "zsh", "core", "paths.zsh"))).toBe(true);
    const paths = readFileSync(join(sandbox.path, ".config", "zsh", "core", "paths.zsh"), "utf-8");
    expect(paths).toContain("migrated from .zshrc by suitup");
  });

  test("appends to existing paths.zsh content", async () => {
    writeFileSync(join(sandbox.path, ".zshrc"), 'export PATH="$HOME/bin:$PATH"');
    mkdirSync(join(sandbox.path, ".config", "zsh", "core"), { recursive: true });
    writeFileSync(
      join(sandbox.path, ".config", "zsh", "core", "paths.zsh"),
      "# existing content\nexport PATH_ORIG=1\n"
    );

    await migratePaths({ home: sandbox.path });

    const paths = readFileSync(join(sandbox.path, ".config", "zsh", "core", "paths.zsh"), "utf-8");
    expect(paths).toContain("# existing content");
    expect(paths).toContain("export PATH_ORIG=1");
    expect(paths).toContain("migrated from .zshrc by suitup");
  });

  test("migrates multiple path-related lines at once", async () => {
    writeFileSync(
      join(sandbox.path, ".zshrc"),
      [
        'echo "start"',
        'export GOPATH="$HOME/go"',
        'export PATH="$GOPATH/bin:$PATH"',
        '. "$HOME/.cargo/env"',
        'export PNPM_HOME="$HOME/.local/share/pnpm"',
        'export PATH="$PNPM_HOME:$PATH"',
        "alias ll='ls -la'",
      ].join("\n")
    );

    const result = await migratePaths({ home: sandbox.path });
    expect(result.migrated).toBe(5);

    const zshrc = readFileSync(join(sandbox.path, ".zshrc"), "utf-8");
    expect(zshrc).toContain('echo "start"');
    expect(zshrc).toContain("alias ll=");
    expect(zshrc).not.toContain("GOPATH");
    expect(zshrc).not.toContain("cargo");
  });

  test("idempotent: running twice does not duplicate", async () => {
    writeFileSync(join(sandbox.path, ".zshrc"), 'export PATH="$HOME/bin:$PATH"\necho "hello"');

    await migratePaths({ home: sandbox.path });
    const result = await migratePaths({ home: sandbox.path });

    expect(result.migrated).toBe(0);
  });
});
