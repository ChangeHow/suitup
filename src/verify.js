import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { commandExists, run } from "./utils/shell.js";
import { readFileSafe } from "./utils/fs.js";

const HOME = homedir();

/** Items to verify. */
const CHECKS = {
  configs: [
    { path: ".zshrc", label: "~/.zshrc" },
    { path: ".zshenv", label: "~/.zshenv" },
    { path: ".config/zsh/core/perf.zsh", label: "~/.config/zsh/core/perf.zsh" },
    { path: ".config/zsh/core/env.zsh", label: "~/.config/zsh/core/env.zsh" },
    { path: ".config/zsh/core/paths.zsh", label: "~/.config/zsh/core/paths.zsh" },
    { path: ".config/zsh/core/options.zsh", label: "~/.config/zsh/core/options.zsh" },
    { path: ".config/zsh/shared/tools.zsh", label: "~/.config/zsh/shared/tools.zsh" },
    { path: ".config/zsh/shared/prompt.zsh", label: "~/.config/zsh/shared/prompt.zsh" },
    { path: ".config/suitup/aliases", label: "~/.config/suitup/aliases" },
    { path: ".config/suitup/zinit-plugins", label: "~/.config/suitup/zinit-plugins" },
  ],
  tools: [
    { cmd: "brew", label: "Homebrew" },
    { cmd: "zsh", label: "Zsh" },
    { cmd: "bat", label: "bat" },
    { cmd: "eza", label: "eza" },
    { cmd: "fzf", label: "fzf" },
    { cmd: "fd", label: "fd" },
    { cmd: "atuin", label: "atuin" },
    { cmd: "zoxide", label: "zoxide" },
    { cmd: "rg", label: "ripgrep" },
    { cmd: "fnm", label: "fnm" },
    { cmd: "node", label: "Node.js" },
    { cmd: "pnpm", label: "pnpm" },
  ],
};

/**
 * Run verification checks and print a report.
 * @param {object} [opts]
 * @param {string} [opts.home] - override home directory (for sandbox testing)
 * @returns {{ configs: object[], tools: object[], syntax: object[] }}
 */
export async function runVerify(opts = {}) {
  const home = opts.home || HOME;
  const results = { configs: [], tools: [], syntax: [] };

  p.intro(pc.bgGreen(pc.black(" Suit up! — Verify ")));

  // --- Config files ---
  p.log.step(pc.bold("Config files"));
  for (const check of CHECKS.configs) {
    const fullPath = join(home, check.path);
    const exists = existsSync(fullPath);
    results.configs.push({ ...check, ok: exists });
    if (exists) {
      p.log.success(`${check.label}`);
    } else {
      p.log.warn(`${check.label} — ${pc.yellow("missing")}`);
    }
  }

  // --- CLI tools ---
  p.log.step(pc.bold("CLI tools"));
  for (const check of CHECKS.tools) {
    const exists = commandExists(check.cmd);
    results.tools.push({ ...check, ok: exists });
    if (exists) {
      p.log.success(`${check.label}`);
    } else {
      p.log.warn(`${check.label} — ${pc.yellow("not found")}`);
    }
  }

  // --- Shell syntax ---
  p.log.step(pc.bold("Shell syntax check"));
  const zshFiles = [
    join(home, ".zshrc"),
    ...CHECKS.configs
      .filter((c) => c.path.endsWith(".zsh"))
      .map((c) => join(home, c.path)),
  ];

  for (const file of zshFiles) {
    if (!existsSync(file)) continue;
    try {
      run(`zsh -n "${file}"`, { quiet: true });
      const label = file.replace(home, "~");
      results.syntax.push({ file: label, ok: true });
      p.log.success(`${label} — syntax OK`);
    } catch (err) {
      const label = file.replace(home, "~");
      results.syntax.push({ file: label, ok: false, error: err.message });
      p.log.error(`${label} — ${pc.red("syntax error")}`);
    }
  }

  // --- Summary ---
  const totalChecks =
    results.configs.length + results.tools.length + results.syntax.length;
  const passed =
    results.configs.filter((c) => c.ok).length +
    results.tools.filter((c) => c.ok).length +
    results.syntax.filter((c) => c.ok).length;

  p.outro(`${passed}/${totalChecks} checks passed`);

  return results;
}

/**
 * Verify config files in a sandbox temp directory (for testing).
 * Creates the expected structure and validates it.
 */
export function verifySandbox(sandboxHome) {
  const results = { configs: [], syntax: [] };

  for (const check of CHECKS.configs) {
    const fullPath = join(sandboxHome, check.path);
    const exists = existsSync(fullPath);
    results.configs.push({ ...check, ok: exists });
  }

  // Syntax check on .zsh files
  const zshFiles = CHECKS.configs
    .filter((c) => c.path.endsWith(".zsh"))
    .map((c) => join(sandboxHome, c.path))
    .filter((f) => existsSync(f));

  for (const file of zshFiles) {
    try {
      run(`zsh -n "${file}"`, { quiet: true });
      results.syntax.push({ file, ok: true });
    } catch (err) {
      results.syntax.push({ file, ok: false, error: err.message });
    }
  }

  return results;
}
