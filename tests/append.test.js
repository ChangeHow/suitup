import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { appendIfMissing, ensureDir } from "../src/utils/fs.js";
import { CONFIGS_DIR } from "../src/constants.js";

vi.mock("../src/steps/plugin-manager.js", () => ({
  installZinit: vi.fn(() => Promise.resolve()),
}));

import { ensurePromptSource, writePromptPreset } from "../src/append.js";
import { installZinit } from "../src/steps/plugin-manager.js";

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
      '# >>> suitup/aliases >>>\nsource "$HOME/.config/suitup/aliases"\n# <<< suitup/aliases <<<',
      "suitup/aliases"
    );

    expect(result).toBe(true);
    const content = readFileSync(zshrcPath, "utf-8");
    expect(content).toContain("suitup/aliases");
    expect(content).toContain("# existing config");
  });

  test("appendIfMissing skips when marker already present", () => {
    const original =
      '# existing config\n# >>> suitup/aliases >>>\nsource "$HOME/.config/suitup/aliases"\n# <<< suitup/aliases <<<\n';
    writeFileSync(zshrcPath, original, "utf-8");

    const result = appendIfMissing(
      zshrcPath,
      '# >>> suitup/aliases >>>\nsource "$HOME/.config/suitup/aliases"\n# <<< suitup/aliases <<<',
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

  test("configs/shared/fzf.zsh exists as a standalone file", () => {
    const fzfFile = join(CONFIGS_DIR, "shared", "fzf.zsh");
    expect(existsSync(fzfFile)).toBe(true);
  });

  test("fzf.zsh contains expected FZF environment variables", () => {
    const fzfContent = readFileSync(join(CONFIGS_DIR, "shared", "fzf.zsh"), "utf-8");
    expect(fzfContent).toContain("FZF_DEFAULT_COMMAND");
    expect(fzfContent).toContain("FZF_CTRL_T_COMMAND");
    expect(fzfContent).toContain("FZF_CTRL_T_OPTS");
  });

  test("fzf.zsh does not contain tool-init cache helpers (those belong in tools.zsh)", () => {
    const fzfContent = readFileSync(join(CONFIGS_DIR, "shared", "fzf.zsh"), "utf-8");
    expect(fzfContent).not.toContain("_source_cached_tool_init");
    expect(fzfContent).not.toContain("_zsh_tools_cache_dir");
  });

  test("tools.zsh no longer embeds FZF env vars directly", () => {
    const toolsContent = readFileSync(join(CONFIGS_DIR, "shared", "tools.zsh"), "utf-8");
    expect(toolsContent).not.toContain("FZF_DEFAULT_COMMAND=");
    expect(toolsContent).not.toContain("FZF_CTRL_T_OPTS=");
  });

  test("fzf-config block appends fzf.zsh content directly (no brittle string splitting)", () => {
    writeFileSync(zshrcPath, "# base\n", "utf-8");

    const fzfContent = readFileSync(join(CONFIGS_DIR, "shared", "fzf.zsh"), "utf-8").trim();
    const block = `\n# >>> suitup/fzf-config >>>\n${fzfContent}\n# <<< suitup/fzf-config <<<\n`;

    const result = appendIfMissing(zshrcPath, block, "suitup/fzf-config");

    expect(result).toBe(true);
    const written = readFileSync(zshrcPath, "utf-8");
    expect(written).toContain("FZF_DEFAULT_COMMAND");
    expect(written).toContain("FZF_CTRL_T_OPTS");
    expect(written).toContain("# >>> suitup/fzf-config >>>");
    expect(written).toContain("# <<< suitup/fzf-config <<<");
  });

  test("fzf-config block is idempotent — double append does not duplicate", () => {
    writeFileSync(zshrcPath, "# base\n", "utf-8");

    const fzfContent = readFileSync(join(CONFIGS_DIR, "shared", "fzf.zsh"), "utf-8").trim();
    const block = `\n# >>> suitup/fzf-config >>>\n${fzfContent}\n# <<< suitup/fzf-config <<<\n`;

    appendIfMissing(zshrcPath, block, "suitup/fzf-config");
    appendIfMissing(zshrcPath, block, "suitup/fzf-config");

    const written = readFileSync(zshrcPath, "utf-8");
    const matches = written.match(/suitup\/fzf-config/g);
    // Should appear exactly twice (open + close marker), not four
    expect(matches.length).toBe(2);
  });
});
