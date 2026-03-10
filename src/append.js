import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { appendIfMissing, ensureDir, readFileSafe, copyFile } from "./utils/fs.js";
import { CONFIGS_DIR, SUITUP_MARKER } from "./constants.js";

const ZSHRC = join(homedir(), ".zshrc");
const SUITUP_DIR = join(homedir(), ".config", "suitup");
const ZSH_CONFIG = join(homedir(), ".config", "zsh");

/** Appendable config blocks. */
const BLOCKS = [
  {
    value: "suitup-aliases",
    label: "Suitup aliases",
    hint: "source ~/.config/suitup/aliases",
    group: "Suitup Configs",
    marker: "suitup/aliases",
    apply() {
      ensureDir(SUITUP_DIR);
      copyFile(join(CONFIGS_DIR, "aliases"), join(SUITUP_DIR, "aliases"));
      return appendIfMissing(
        ZSHRC,
        '\n# >>> suitup/aliases >>>\nsource_if_exists "$HOME/.config/suitup/aliases"\n# <<< suitup/aliases <<<\n',
        "suitup/aliases"
      );
    },
  },
  {
    value: "suitup-plugins",
    label: "Zinit plugins",
    hint: "source ~/.config/suitup/zinit-plugins",
    group: "Suitup Configs",
    marker: "suitup/zinit-plugins",
    apply() {
      ensureDir(SUITUP_DIR);
      copyFile(join(CONFIGS_DIR, "zinit-plugins"), join(SUITUP_DIR, "zinit-plugins"));
      return appendIfMissing(
        ZSHRC,
        '\n# >>> suitup/zinit-plugins >>>\nsource_if_exists "$HOME/.config/suitup/zinit-plugins"\n# <<< suitup/zinit-plugins <<<\n',
        "suitup/zinit-plugins"
      );
    },
  },
  {
    value: "tools-init",
    label: "Tool initialization",
    hint: "atuin, fzf, zoxide, fnm",
    group: "Shell Enhancements",
    marker: "suitup/tools-init",
    apply() {
      const block = [
        "",
        "# >>> suitup/tools-init >>>",
        'command -v atuin  &>/dev/null && eval "$(atuin init zsh)"',
        'command -v fzf    &>/dev/null && eval "$(fzf --zsh)"',
        'command -v zoxide &>/dev/null && eval "$(zoxide init zsh)"',
        'command -v fnm    &>/dev/null && eval "$(fnm env --use-on-cd --version-file-strategy=recursive --shell zsh)"',
        '[[ -s "$HOME/.bun/_bun" ]] && source "$HOME/.bun/_bun"',
        "# <<< suitup/tools-init <<<",
        "",
      ].join("\n");
      return appendIfMissing(ZSHRC, block, "suitup/tools-init");
    },
  },
  {
    value: "zsh-options",
    label: "Zsh options",
    hint: "history, completion, auto-cd",
    group: "Shell Enhancements",
    marker: "suitup/zsh-options",
    apply() {
      const content = readFileSync(join(CONFIGS_DIR, "core", "options.zsh"), "utf-8");
      const block = `\n# >>> suitup/zsh-options >>>\n${content}\n# <<< suitup/zsh-options <<<\n`;
      return appendIfMissing(ZSHRC, block, "suitup/zsh-options");
    },
  },
  {
    value: "env-vars",
    label: "Environment variables",
    hint: "BAT_THEME, ATUIN config",
    group: "Shell Enhancements",
    marker: "suitup/env",
    apply() {
      const content = readFileSync(join(CONFIGS_DIR, "core", "env.zsh"), "utf-8");
      const block = `\n# >>> suitup/env >>>\n${content}\n# <<< suitup/env <<<\n`;
      return appendIfMissing(ZSHRC, block, "suitup/env");
    },
  },
  {
    value: "perf",
    label: "Startup performance monitor",
    hint: "timing report on shell startup",
    group: "Advanced",
    marker: "suitup/perf",
    apply() {
      const content = readFileSync(join(CONFIGS_DIR, "core", "perf.zsh"), "utf-8");
      const block = `\n# >>> suitup/perf >>>\n${content}\n# <<< suitup/perf <<<\n`;
      return appendIfMissing(ZSHRC, block, "suitup/perf");
    },
  },
  {
    value: "fzf-config",
    label: "FZF configuration",
    hint: "fd-based search + preview",
    group: "Advanced",
    marker: "suitup/fzf-config",
    apply() {
      const toolsContent = readFileSync(join(CONFIGS_DIR, "shared", "tools.zsh"), "utf-8");
      // Extract only FZF-related config (everything before "# Tool initialization")
      const fzfPart = toolsContent.split("# Tool initialization")[0].trim();
      const block = `\n# >>> suitup/fzf-config >>>\n${fzfPart}\n# <<< suitup/fzf-config <<<\n`;
      return appendIfMissing(ZSHRC, block, "suitup/fzf-config");
    },
  },
];

/**
 * Append mode — add recommended configs to an existing .zshrc.
 */
export async function runAppend() {
  p.intro(pc.bgYellow(pc.black(" Suit up! — Append Mode ")));

  if (!existsSync(ZSHRC)) {
    p.log.warn("No ~/.zshrc found. Use `node src/cli.js setup` for a full setup instead.");
    p.outro("Nothing to append to.");
    return;
  }

  p.log.info(`Detected existing ${pc.cyan("~/.zshrc")}`);

  // Check which blocks are already present
  const existing = readFileSafe(ZSHRC);
  const available = BLOCKS.filter((b) => !existing.includes(b.marker));

  if (available.length === 0) {
    p.log.success("All suitup configs are already present in .zshrc");
    p.outro("Nothing to do.");
    return;
  }

  // Also ensure source_if_exists helper is present
  if (!existing.includes("source_if_exists")) {
    appendIfMissing(
      ZSHRC,
      '\n# >>> suitup/helper >>>\nsource_if_exists() { [[ -f "$1" ]] && source "$1"; }\n# <<< suitup/helper <<<\n',
      "suitup/helper"
    );
  }

  // Group options for display
  const groups = {};
  for (const block of available) {
    if (!groups[block.group]) groups[block.group] = [];
    groups[block.group].push({
      value: block.value,
      label: block.label,
      hint: block.hint,
    });
  }

  const selected = await p.groupMultiselect({
    message: "Select configs to append to .zshrc:",
    options: groups,
  });

  if (p.isCancel(selected) || selected.length === 0) {
    p.cancel("Nothing appended.");
    return;
  }

  let appended = 0;
  for (const value of selected) {
    const block = BLOCKS.find((b) => b.value === value);
    if (block && block.apply()) {
      appended++;
      p.log.success(`Appended: ${block.label}`);
    }
  }

  p.outro(
    appended > 0
      ? `Appended ${appended} config(s). Run ${pc.cyan("exec zsh")} to reload.`
      : "No changes made (configs already present)."
  );
}
