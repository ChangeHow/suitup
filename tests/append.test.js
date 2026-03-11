import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { appendIfMissing, ensureDir, readFileSafe } from "../src/utils/fs.js";
import { CONFIGS_DIR } from "../src/constants.js";

describe("Append mode utilities", () => {
  let sandbox;
  let zshrcPath;

  beforeEach(() => {
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
});

describe("fzf-config block", () => {
  let sandbox;
  let zshrcPath;

  beforeEach(() => {
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
