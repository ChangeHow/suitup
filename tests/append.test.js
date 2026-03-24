import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { appendIfMissing, ensureDir } from "../src/utils/fs.js";
import { CONFIGS_DIR } from "../src/constants.js";

vi.mock("@clack/prompts", () => ({
  log: { success: vi.fn(), step: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
  groupMultiselect: vi.fn(),
}));

vi.mock("../src/steps/plugin-manager.js", () => ({
  installZinit: vi.fn(() => Promise.resolve()),
}));

vi.mock("../src/steps/cli-tools.js", () => ({
  installCliTools: vi.fn(() => Promise.resolve()),
}));

vi.mock("../src/steps/frontend.js", () => ({
  installFrontendTools: vi.fn(() => Promise.resolve()),
}));

vi.mock("../src/utils/shell.js", () => ({
  commandExists: vi.fn(),
  brewInstalled: vi.fn(),
  brewInstall: vi.fn(() => true),
  run: vi.fn(() => ""),
  runStream: vi.fn(() => Promise.resolve(0)),
}));

import {
  ensurePromptSource,
  ensureToolsInitDependencies,
  getMissingToolsInitCommands,
  needsToolsInitRepair,
  writePromptPreset,
} from "../src/append.js";
import { installZinit } from "../src/steps/plugin-manager.js";
import { installCliTools } from "../src/steps/cli-tools.js";
import { installFrontendTools } from "../src/steps/frontend.js";

describe("Append mode utilities", () => {
  let sandbox;
  let zshrcPath;

  beforeEach(() => {
    vi.clearAllMocks();
    sandbox = mkdtempSync(join(tmpdir(), "suitup-test-"));
    zshrcPath = join(sandbox, ".zshrc");
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  test("appendIfMissing adds content when marker is absent", () => {
    writeFileSync(zshrcPath, "# existing config\n", "utf-8");

    const result = appendIfMissing(
      zshrcPath,
      '# >>> suitup/aliases >>>\nsource "$HOME/.config/zsh/shared/aliases.zsh"\n# <<< suitup/aliases <<<',
      "suitup/aliases"
    );

    expect(result).toBe(true);
    const content = readFileSync(zshrcPath, "utf-8");
    expect(content).toContain("suitup/aliases");
    expect(content).toContain("# existing config");
  });

  test("appendIfMissing skips when marker already present", () => {
    const original =
      '# existing config\n# >>> suitup/aliases >>>\nsource "$HOME/.config/zsh/shared/aliases.zsh"\n# <<< suitup/aliases <<<\n';
    writeFileSync(zshrcPath, original, "utf-8");

    const result = appendIfMissing(
      zshrcPath,
      '# >>> suitup/aliases >>>\nsource "$HOME/.config/zsh/shared/aliases.zsh"\n# <<< suitup/aliases <<<',
      "suitup/aliases"
    );

    expect(result).toBe(false);
    const content = readFileSync(zshrcPath, "utf-8");
    expect(content).toBe(original);
  });

  test("appendIfMissing is idempotent — double call does not duplicate", () => {
    writeFileSync(zshrcPath, "# existing config\n", "utf-8");

    appendIfMissing(zshrcPath, "# >>> suitup/test >>>\ntest\n# <<< suitup/test <<<", "suitup/test");
    appendIfMissing(zshrcPath, "# >>> suitup/test >>>\ntest\n# <<< suitup/test <<<", "suitup/test");

    const content = readFileSync(zshrcPath, "utf-8");
    const matches = content.match(/suitup\/test/g);
    // Should appear exactly 2 times (open marker + close marker), not 4
    expect(matches.length).toBe(2);
  });

  test("appendIfMissing creates file if it does not exist", () => {
    const newFile = join(sandbox, "subdir", "newfile");

    const result = appendIfMissing(
      newFile,
      "# >>> suitup/new >>>\nnew content\n# <<< suitup/new <<<",
      "suitup/new"
    );

    expect(result).toBe(true);
    expect(existsSync(newFile)).toBe(true);
    expect(readFileSync(newFile, "utf-8")).toContain("new content");
  });

  test("multiple different blocks can be appended independently", () => {
    writeFileSync(zshrcPath, "# base\n", "utf-8");

    appendIfMissing(zshrcPath, "# >>> suitup/a >>>\nblock-a\n# <<< suitup/a <<<", "suitup/a");
    appendIfMissing(zshrcPath, "# >>> suitup/b >>>\nblock-b\n# <<< suitup/b <<<", "suitup/b");

    const content = readFileSync(zshrcPath, "utf-8");
    expect(content).toContain("block-a");
    expect(content).toContain("block-b");
    expect(content).toContain("# base");
  });

  test("writePromptPreset replaces prompt.zsh with the p10k preset", async () => {
    const sharedDir = join(sandbox, ".config", "zsh", "shared");
    ensureDir(sharedDir);
    writeFileSync(join(sharedDir, "prompt.zsh"), "old prompt\n", "utf-8");

    const changed = await writePromptPreset("p10k", { home: sandbox });

    expect(changed).toBe(true);
    expect(installZinit).toHaveBeenCalledWith({ home: sandbox });
    expect(readFileSync(join(sharedDir, "prompt.zsh"), "utf-8")).toBe(
      readFileSync(join(CONFIGS_DIR, "shared", "prompt.zsh"), "utf-8")
    );
  });

  test("writePromptPreset replaces prompt.zsh with the basic preset", async () => {
    const sharedDir = join(sandbox, ".config", "zsh", "shared");
    ensureDir(sharedDir);

    const changed = await writePromptPreset("basic", { home: sandbox });

    expect(changed).toBe(true);
    expect(readFileSync(join(sharedDir, "prompt.zsh"), "utf-8")).toBe(
      readFileSync(join(CONFIGS_DIR, "shared", "prompt-basic.zsh"), "utf-8")
    );
  });

  test("ensurePromptSource appends prompt loader when missing", () => {
    writeFileSync(zshrcPath, "# base\n", "utf-8");

    const changed = ensurePromptSource({ home: sandbox });

    expect(changed).toBe(true);
    expect(readFileSync(zshrcPath, "utf-8")).toContain('source_if_exists "$HOME/.config/zsh/shared/prompt.zsh"');
  });

  test("tools-init repair is needed when config exists but fnm is missing", () => {
    const existing = [
      "# >>> suitup/tools-init >>>",
      'source_if_exists "$HOME/.config/zsh/shared/tools.zsh"',
      '[[ -s "$HOME/.bun/_bun" ]] && source "$HOME/.bun/_bun"',
      "# <<< suitup/tools-init <<<",
      "",
    ].join("\n");

    const needsRepair = needsToolsInitRepair(existing, (name) => name !== "fnm");

    expect(needsRepair).toBe(true);
    expect(getMissingToolsInitCommands((name) => name !== "fnm")).toEqual(["fnm"]);
  });

  test("ensureToolsInitDependencies installs missing shell tools and frontend tools together", async () => {
    const commandExistsFn = vi.fn((name) => !["atuin", "fzf", "fnm"].includes(name));

    const changed = await ensureToolsInitDependencies({ commandExistsFn });

    expect(changed).toBe(true);
    expect(installCliTools).toHaveBeenCalledWith(["atuin", "fzf"]);
    expect(installFrontendTools).toHaveBeenCalledTimes(1);
  });

  test("ensureToolsInitDependencies skips installers when everything is already present", async () => {
    const commandExistsFn = vi.fn(() => true);

    const changed = await ensureToolsInitDependencies({ commandExistsFn });

    expect(changed).toBe(false);
    expect(installCliTools).not.toHaveBeenCalled();
    expect(installFrontendTools).not.toHaveBeenCalled();
  });
  test("tools-init block sources tools.zsh instead of inline eval commands", () => {
    writeFileSync(zshrcPath, '# existing config\nsource_if_exists() { [[ -f "$1" ]] && source "$1"; }\n', "utf-8");

    const block = [
      "",
      "# >>> suitup/tools-init >>>",
      'source_if_exists "$HOME/.config/zsh/shared/tools.zsh"',
      '[[ -s "$HOME/.bun/_bun" ]] && source "$HOME/.bun/_bun"',
      "# <<< suitup/tools-init <<<",
      "",
    ].join("\n");

    const result = appendIfMissing(zshrcPath, block, "suitup/tools-init");

    expect(result).toBe(true);
    const content = readFileSync(zshrcPath, "utf-8");
    // Should source the managed tools.zsh file
    expect(content).toContain('source_if_exists "$HOME/.config/zsh/shared/tools.zsh"');
    // Should NOT contain inline eval commands
    expect(content).not.toContain('eval "$(atuin init zsh)"');
    expect(content).not.toContain('eval "$(fzf --zsh)"');
  });
});

describe("fzf-config block", () => {
  let sandbox;
  let zshrcPath;

  beforeEach(() => {
    vi.clearAllMocks();
    sandbox = mkdtempSync(join(tmpdir(), "suitup-test-"));
    zshrcPath = join(sandbox, ".zshrc");
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  test("configs/shared/tools/fzf.zsh exists as a tool module file", () => {
    const fzfFile = join(CONFIGS_DIR, "shared", "tools", "fzf.zsh");
    expect(existsSync(fzfFile)).toBe(true);
  });

  test("fzf.zsh contains expected FZF environment variables", () => {
    const fzfContent = readFileSync(join(CONFIGS_DIR, "shared", "tools", "fzf.zsh"), "utf-8");
    expect(fzfContent).toContain("FZF_DEFAULT_COMMAND");
    expect(fzfContent).toContain("FZF_CTRL_T_COMMAND");
    expect(fzfContent).toContain("FZF_CTRL_T_OPTS");
  });

  test("fzf.zsh does not contain cache dir setup (that belongs in _loader.zsh)", () => {
    const fzfContent = readFileSync(join(CONFIGS_DIR, "shared", "tools", "fzf.zsh"), "utf-8");
    expect(fzfContent).not.toContain("_zsh_tools_cache_dir");
  });

  test("tools.zsh no longer embeds FZF env vars directly", () => {
    const toolsContent = readFileSync(join(CONFIGS_DIR, "shared", "tools.zsh"), "utf-8");
    expect(toolsContent).not.toContain("FZF_DEFAULT_COMMAND=");
    expect(toolsContent).not.toContain("FZF_CTRL_T_OPTS=");
  });

  test("fzf-config block sources fzf.zsh instead of inlining content", () => {
    writeFileSync(zshrcPath, '# base\nsource_if_exists() { [[ -f "$1" ]] && source "$1"; }\n', "utf-8");

    const block = '\n# >>> suitup/fzf-config >>>\nsource_if_exists "$HOME/.config/zsh/shared/fzf.zsh"\n# <<< suitup/fzf-config <<<\n';

    const result = appendIfMissing(zshrcPath, block, "suitup/fzf-config");

    expect(result).toBe(true);
    const written = readFileSync(zshrcPath, "utf-8");
    expect(written).toContain('source_if_exists "$HOME/.config/zsh/shared/fzf.zsh"');
    expect(written).toContain("# >>> suitup/fzf-config >>>");
    expect(written).toContain("# <<< suitup/fzf-config <<<");
    // Should NOT inline FZF env vars directly
    expect(written).not.toContain("FZF_DEFAULT_COMMAND");
  });

  test("fzf-config block is idempotent — double append does not duplicate", () => {
    writeFileSync(zshrcPath, "# base\n", "utf-8");

    const block = '\n# >>> suitup/fzf-config >>>\nsource_if_exists "$HOME/.config/zsh/shared/fzf.zsh"\n# <<< suitup/fzf-config <<<\n';

    appendIfMissing(zshrcPath, block, "suitup/fzf-config");
    appendIfMissing(zshrcPath, block, "suitup/fzf-config");

    const written = readFileSync(zshrcPath, "utf-8");
    const matches = written.match(/suitup\/fzf-config/g);
    // Should appear exactly twice (open + close marker), not four
    expect(matches.length).toBe(2);
  });
});

describe("append blocks source managed files instead of inlining", () => {
  let sandbox;
  let zshrcPath;

  beforeEach(() => {
    vi.clearAllMocks();
    sandbox = mkdtempSync(join(tmpdir(), "suitup-test-"));
    zshrcPath = join(sandbox, ".zshrc");
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  test("zsh-options block sources core/options.zsh instead of inlining", () => {
    writeFileSync(zshrcPath, "# base\n", "utf-8");

    const block = '\n# >>> suitup/zsh-options >>>\nsource_if_exists "$HOME/.config/zsh/core/options.zsh"\n# <<< suitup/zsh-options <<<\n';
    const result = appendIfMissing(zshrcPath, block, "suitup/zsh-options");

    expect(result).toBe(true);
    const content = readFileSync(zshrcPath, "utf-8");
    expect(content).toContain('source_if_exists "$HOME/.config/zsh/core/options.zsh"');
    // Should NOT inline the options content
    expect(content).not.toContain("setopt AUTO_CD");
    expect(content).not.toContain("HISTSIZE");
  });

  test("env-vars block sources core/env.zsh instead of inlining", () => {
    writeFileSync(zshrcPath, "# base\n", "utf-8");

    const block = '\n# >>> suitup/env >>>\nsource_if_exists "$HOME/.config/zsh/core/env.zsh"\n# <<< suitup/env <<<\n';
    const result = appendIfMissing(zshrcPath, block, "suitup/env");

    expect(result).toBe(true);
    const content = readFileSync(zshrcPath, "utf-8");
    expect(content).toContain('source_if_exists "$HOME/.config/zsh/core/env.zsh"');
    // Should NOT inline the env content
    expect(content).not.toContain("BAT_THEME");
  });

  test("perf block sources core/perf.zsh instead of inlining", () => {
    writeFileSync(zshrcPath, "# base\n", "utf-8");

    const block = '\n# >>> suitup/perf >>>\nsource_if_exists "$HOME/.config/zsh/core/perf.zsh"\n# <<< suitup/perf <<<\n';
    const result = appendIfMissing(zshrcPath, block, "suitup/perf");

    expect(result).toBe(true);
    const content = readFileSync(zshrcPath, "utf-8");
    expect(content).toContain('source_if_exists "$HOME/.config/zsh/core/perf.zsh"');
    // Should NOT inline the perf content
    expect(content).not.toContain("EPOCHREALTIME");
    expect(content).not.toContain("_zsh_report");
  });
});
