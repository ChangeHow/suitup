import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { backupShellRcFiles } from "./zsh-config.js";
import { readFileSafe, writeFile, ensureDir } from "../utils/fs.js";
import { commandExists, run } from "../utils/shell.js";

/**
 * Patterns that identify PATH-related lines which should live in paths.zsh.
 * Each pattern is tested against a single line of the file.
 */
const PATH_LINE_PATTERNS = [
  // Direct PATH assignment: export PATH=..., PATH=...
  /^\s*(export\s+)?PATH\s*=/,
  // Zsh path array: path+=(...), path=(...)
  /^\s*path\s*\+=/,
  /^\s*path\s*=\s*\(/,
  // typeset -U path (path deduplication)
  /^\s*typeset\s+.*\bpath\b/,
  // eval "$(... shellenv)" — e.g. brew shellenv
  /^\s*eval\s+.*\bshellenv\b/,
  // eval "$(tool init|env ...)" — pyenv, rbenv, fnm, etc.
  /^\s*eval\s+.*\b(pyenv|rbenv|jenv|mise|rtx|asdf|fnm)\s+(init|env)\b/,
  // source/. for tool environments that set PATH
  /^\s*(source|\.)\s+.*\bcargo\/env\b/,
  /^\s*(source|\.)\s+.*\bghcup\/env\b/,
  // NVM loader: [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  /^\s*\[?\[?\s*-s\s+.*\bnvm\.sh\b/,
  // Bun loader: [ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"
  /^\s*\[?\[?\s*-s\s+.*\b_bun\b/,
  // [[ ... ]] && source ... patterns for bun/nvm
  /^\s*\[\[.*\b(_bun|nvm\.sh)\b.*\]\].*source/,
  // Well-known env vars that are PATH-related
  /^\s*export\s+(GOPATH|GOROOT|CARGO_HOME|RUSTUP_HOME|PYENV_ROOT|JAVA_HOME|ANDROID_HOME|ANDROID_SDK_ROOT|NVM_DIR|FNM_DIR|BUN_INSTALL|PNPM_HOME|DENO_INSTALL|GEM_HOME|FLUTTER_HOME)\s*=/,
];

/**
 * Lines that should NOT be migrated even if they match patterns.
 */
const EXCLUDE_PATTERNS = [
  // suitup orchestration line: source "$ZSH_CONFIG/core/paths.zsh"
  /source.*\$ZSH_CONFIG/,
  // alternate form: source "$HOME/.config/zsh/..."
  /source.*\$HOME\/\.config\/zsh/,
];

const SUITUP_BLOCK_START = /^#\s*>>>\s*suitup/;
const SUITUP_BLOCK_END = /^#\s*<<<\s*suitup/;

/**
 * Check if a line at the given index is inside a suitup-managed block.
 */
function isInSuitupBlock(lines, lineIndex) {
  let depth = 0;
  for (let i = 0; i < lineIndex; i++) {
    if (SUITUP_BLOCK_START.test(lines[i])) depth++;
    if (SUITUP_BLOCK_END.test(lines[i])) depth--;
  }
  return depth > 0;
}

/**
 * Check if a line is a path-related line that should be migrated.
 */
function isPathLine(line) {
  if (EXCLUDE_PATTERNS.some((p) => p.test(line))) return false;
  return PATH_LINE_PATTERNS.some((p) => p.test(line));
}

/**
 * Check if a line is a comment (potential annotation for the next path line).
 */
function isAssociatedComment(line) {
  return /^\s*#/.test(line) && !SUITUP_BLOCK_START.test(line) && !SUITUP_BLOCK_END.test(line);
}

/**
 * Extract path-related lines from .zshrc content.
 * Returns { pathLines: string[], remainingLines: string[] }
 */
export function extractPathLines(content) {
  const lines = content.split("\n");
  const pathLineIndices = new Set();

  // First pass: identify path-related lines
  for (let i = 0; i < lines.length; i++) {
    if (isInSuitupBlock(lines, i)) continue;
    if (isPathLine(lines[i])) {
      pathLineIndices.add(i);
      // Include the comment line directly above (if any)
      if (i > 0 && isAssociatedComment(lines[i - 1]) && !pathLineIndices.has(i - 1)) {
        pathLineIndices.add(i - 1);
      }
    }
  }

  // Second pass: include backslash continuation lines
  const sorted = [...pathLineIndices].sort((a, b) => a - b);
  for (const idx of sorted) {
    let j = idx;
    while (j < lines.length - 1 && lines[j].trimEnd().endsWith("\\")) {
      j++;
      pathLineIndices.add(j);
    }
  }

  const pathLines = [];
  const remainingLines = [];

  for (let i = 0; i < lines.length; i++) {
    if (pathLineIndices.has(i)) {
      pathLines.push(lines[i]);
    } else {
      remainingLines.push(lines[i]);
    }
  }

  // Clean up consecutive blank lines left behind after removal
  const cleanedRemaining = [];
  let lastWasBlank = false;
  for (const line of remainingLines) {
    const isBlank = line.trim() === "";
    if (isBlank && lastWasBlank) continue;
    cleanedRemaining.push(line);
    lastWasBlank = isBlank;
  }

  return {
    pathLines,
    remainingLines: cleanedRemaining,
  };
}

/**
 * Build the block to append to paths.zsh.
 */
function buildPathBlock(pathLines) {
  if (pathLines.length === 0) return "";

  return [
    "",
    "# >>> migrated from .zshrc by suitup >>>",
    ...pathLines,
    "# <<< migrated from .zshrc by suitup <<<",
    "",
  ].join("\n");
}

/**
 * Run zsh syntax check on a file.
 * Returns { ok: boolean, error?: string, skipped?: boolean }
 */
function syntaxCheck(filePath) {
  if (!commandExists("zsh")) {
    return { ok: true, skipped: true };
  }
  try {
    run(`zsh -n "${filePath}"`, { quiet: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Migrate PATH-related lines from .zshrc to paths.zsh.
 * @param {object} [opts]
 * @param {string} [opts.home] - override home directory (for testing)
 * @param {boolean} [opts.dryRun] - if true, don't actually modify files
 * @returns {{ migrated: number, pathLines: string[], dryRun?: boolean, backupDir?: string }}
 */
export async function migratePaths({ home, dryRun = false } = {}) {
  const base = home || homedir();
  const zshrcPath = join(base, ".zshrc");
  const pathsPath = join(base, ".config", "zsh", "core", "paths.zsh");

  if (!existsSync(zshrcPath)) {
    throw new Error(".zshrc not found");
  }

  const zshrcContent = readFileSync(zshrcPath, "utf-8");
  const { pathLines, remainingLines } = extractPathLines(zshrcContent);

  if (pathLines.length === 0) {
    return { migrated: 0, pathLines: [] };
  }

  if (dryRun) {
    return { migrated: pathLines.length, pathLines, dryRun: true };
  }

  // Read existing paths.zsh (empty string if missing)
  const existingPaths = readFileSafe(pathsPath);

  // Create backup before modifying
  const backup = await backupShellRcFiles({ home: base, reason: "migrate-paths" });

  // Save originals in memory for possible rollback
  const originalZshrc = zshrcContent;
  const originalPaths = existingPaths || null;

  // Build new content
  const newPathsContent = existingPaths + buildPathBlock(pathLines);
  const newZshrcContent = remainingLines.join("\n");

  // Write modified files
  ensureDir(join(base, ".config", "zsh", "core"));
  writeFile(pathsPath, newPathsContent);
  writeFile(zshrcPath, newZshrcContent);

  // Syntax check
  const zshrcCheck = syntaxCheck(zshrcPath);
  const pathsCheck = syntaxCheck(pathsPath);

  if (!zshrcCheck.ok || !pathsCheck.ok) {
    // Rollback
    writeFileSync(zshrcPath, originalZshrc, "utf-8");
    if (originalPaths !== null) {
      writeFileSync(pathsPath, originalPaths, "utf-8");
    }

    const errors = [];
    if (!zshrcCheck.ok) errors.push(`zshrc: ${zshrcCheck.error}`);
    if (!pathsCheck.ok) errors.push(`paths.zsh: ${pathsCheck.error}`);

    throw new Error(
      `Syntax check failed after migration, rolled back. Errors:\n${errors.join("\n")}`
    );
  }

  return {
    migrated: pathLines.length,
    pathLines,
    backupDir: backup?.backupDir,
  };
}
