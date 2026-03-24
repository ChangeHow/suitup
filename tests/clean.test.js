import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { createSandbox } from "./helpers.js";
import { CONFIGS_DIR } from "../src/constants.js";

const { mockConfirm } = vi.hoisted(() => ({
  mockConfirm: vi.fn(),
}));

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  log: { success: vi.fn(), step: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  confirm: mockConfirm,
  isCancel: vi.fn(() => false),
}));

import { cleanSandbox, runClean } from "../src/clean.js";

function writeManagedTree(base) {
  const managedFiles = [
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
    ["config.vim", ".config/zsh/local/config.vim"],
    ["zshrc.template", ".zshrc"],
    ["zshenv.template", ".zshenv"],
  ];

  for (const [src, dest] of managedFiles) {
    mkdirSync(dirname(join(base, dest)), { recursive: true });
    writeFileSync(join(base, dest), readFileSync(join(CONFIGS_DIR, src), "utf-8"), "utf-8");
  }
}

describe("clean command", () => {
  let sandbox;

  beforeEach(() => {
    vi.clearAllMocks();
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.cleanup();
  });

  test("restores the latest non-suitup backups for managed zsh files", () => {
    writeManagedTree(sandbox.path);

    const backupsRoot = join(sandbox.path, ".config", "zsh", "backups");
    const olderBackup = join(backupsRoot, "2026-03-19T10-00-00-000Z-setup");
    const newerBackup = join(backupsRoot, "2026-03-19T11-00-00-000Z-setup");
    mkdirSync(olderBackup, { recursive: true });
    mkdirSync(newerBackup, { recursive: true });

    writeFileSync(join(olderBackup, ".zshrc"), "# original zshrc\nexport FOO=bar\n", "utf-8");
    writeFileSync(join(olderBackup, ".zshenv"), "# original zshenv\nexport BAR=baz\n", "utf-8");
    writeFileSync(
      join(newerBackup, ".zshrc"),
      readFileSync(join(CONFIGS_DIR, "zshrc.template"), "utf-8"),
      "utf-8"
    );
    writeFileSync(
      join(newerBackup, ".zshenv"),
      readFileSync(join(CONFIGS_DIR, "zshenv.template"), "utf-8"),
      "utf-8"
    );

    const summary = cleanSandbox(sandbox.path);

    expect(readFileSync(join(sandbox.path, ".zshrc"), "utf-8")).toContain("export FOO=bar");
    expect(readFileSync(join(sandbox.path, ".zshenv"), "utf-8")).toContain("export BAR=baz");
    expect(existsSync(join(sandbox.path, ".config", "zsh"))).toBe(false);
    expect(summary.restored).toContain("~/.zshrc");
    expect(summary.restored).toContain("~/.zshenv");
  });

  test("strips appended suitup blocks from an existing zshrc", () => {
    writeFileSync(
      join(sandbox.path, ".zshrc"),
      [
        "# custom config",
        "export FOO=bar",
        "# >>> suitup/helper >>>",
        'source_if_exists() { [[ -f "$1" ]] && source "$1"; }',
        "# <<< suitup/helper <<<",
        "# >>> suitup/aliases >>>",
        'source_if_exists "$HOME/.config/zsh/shared/aliases.zsh"',
        "# <<< suitup/aliases <<<",
        "",
      ].join("\n"),
      "utf-8"
    );
    mkdirSync(join(sandbox.path, ".config", "zsh", "shared"), { recursive: true });
    writeFileSync(
      join(sandbox.path, ".config", "zsh", "shared", "aliases.zsh"),
      readFileSync(join(CONFIGS_DIR, "shared", "aliases.zsh"), "utf-8"),
      "utf-8"
    );

    const summary = cleanSandbox(sandbox.path);
    const cleaned = readFileSync(join(sandbox.path, ".zshrc"), "utf-8");

    expect(cleaned).toContain("export FOO=bar");
    expect(cleaned).not.toContain("suitup/helper");
    expect(cleaned).not.toContain("suitup/aliases");
    expect(existsSync(join(sandbox.path, ".config", "zsh", "shared"))).toBe(false);
    expect(summary.cleaned).toContain("~/.zshrc");
  });

  test("preserves user-modified managed files", () => {
    mkdirSync(join(sandbox.path, ".config", "zsh", "core"), { recursive: true });
    mkdirSync(join(sandbox.path, ".config", "zsh", "shared"), { recursive: true });
    writeFileSync(join(sandbox.path, ".config", "zsh", "core", "env.zsh"), "# custom env\n", "utf-8");
    writeFileSync(join(sandbox.path, ".config", "zsh", "shared", "aliases.zsh"), "# custom aliases\n", "utf-8");
    writeFileSync(join(sandbox.path, ".zshenv"), "# my zshenv\nexport FOO=bar\n", "utf-8");

    const summary = cleanSandbox(sandbox.path);

    expect(readFileSync(join(sandbox.path, ".config", "zsh", "core", "env.zsh"), "utf-8")).toBe("# custom env\n");
    expect(readFileSync(join(sandbox.path, ".config", "zsh", "shared", "aliases.zsh"), "utf-8")).toBe("# custom aliases\n");
    expect(readFileSync(join(sandbox.path, ".zshenv"), "utf-8")).toContain("export FOO=bar");
    expect(summary.preserved).toContain("~/.config/zsh/core/env.zsh");
    expect(summary.preserved).toContain("~/.config/zsh/shared/aliases.zsh");
    expect(summary.preserved).toContain("~/.zshenv");
  });

  test("runClean skips work when the user declines", async () => {
    mockConfirm.mockResolvedValue(false);
    writeManagedTree(sandbox.path);

    const result = await runClean({ home: sandbox.path });

    expect(result).toBeNull();
    expect(existsSync(join(sandbox.path, ".config", "zsh"))).toBe(true);
    expect(existsSync(join(sandbox.path, ".config", "zsh", "local", "config.vim"))).toBe(true);
  });
});
