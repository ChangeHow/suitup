import * as p from "@clack/prompts";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ensureDir, readFileSafe, writeFile } from "../utils/fs.js";
import { applyManagedConfigUpdate } from "../utils/config-diff.js";
import { CONFIGS_DIR } from "../constants.js";

const ALIAS_NAME_RE = /^\s*alias\s+(?:-[A-Za-z]+\s+)*([A-Za-z0-9_.-]+)=/;

function getAliasName(line) {
  return line.match(ALIAS_NAME_RE)?.[1];
}

export function redactAliasValues(content) {
  return content
    .split(/\r?\n/)
    .map((line) => {
      const name = getAliasName(line);
      if (name) return `alias ${name}=<redacted>`;
      if (!line.trim() || line.trimStart().startsWith("#")) return line;
      return "<redacted user line>";
    })
    .join("\n");
}

/**
 * Create the user-owned aliases file once. Legacy Suitup aliases that do not
 * overlap current shared aliases are migrated without printing their values.
 * @param {object} [opts]
 * @param {string} [opts.home] - override home directory (for testing)
 */
export function initializeUserAliases({ home } = {}) {
  const base = home || homedir();
  const dest = join(base, ".config", "zsh", "local", "aliases.zsh");
  const destExists = existsSync(dest);
  const template = readFileSafe(join(CONFIGS_DIR, "local", "aliases.zsh"));
  const existing = destExists ? readFileSafe(dest) : template;
  const legacyPath = join(base, ".config", "suitup", "aliases");
  const legacyLines = readFileSafe(legacyPath).split(/\r?\n/);
  const sharedAliasNames = new Set(
    readFileSafe(join(CONFIGS_DIR, "shared", "aliases.zsh"))
      .split(/\r?\n/)
      .map(getAliasName)
      .filter(Boolean)
  );
  const existingAliasNames = new Set(existing.split(/\r?\n/).map(getAliasName).filter(Boolean));
  const conflictingAliases = new Set(
    legacyLines.map(getAliasName).filter((name) => name && sharedAliasNames.has(name))
  );
  let migratedLines = legacyLines.filter((line) => {
    const name = getAliasName(line);
    return name && !line.trimEnd().endsWith("\\") && !sharedAliasNames.has(name) && !existingAliasNames.has(name);
  });
  const skippedLines = legacyLines.filter((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith("#") && (!getAliasName(line) || trimmed.endsWith("\\"));
  }).length;
  let content = existing;

  if (migratedLines.length > 0) {
    const header = existing.includes("# Migrated from ~/.config/suitup/aliases")
      ? ""
      : "# Migrated from ~/.config/suitup/aliases\n";
    content = `${existing.trimEnd()}\n\n${header}${migratedLines.join("\n")}\n`;

    if (spawnSync("zsh", ["-n"], { input: content, encoding: "utf-8" }).status !== 0) {
      p.log.warn(`Skipped ${migratedLines.length} legacy aliases because the merged file failed zsh syntax validation.`);
      migratedLines = [];
      content = existing;
    }
  }

  if (!destExists || content !== existing) {
    writeFile(dest, content);
  }
  chmodSync(dest, 0o600);

  if (migratedLines.length > 0) {
    p.log.success(`Migrated ${migratedLines.length} user aliases to ~/.config/zsh/local/aliases.zsh`);
  } else if (!destExists) {
    p.log.success("User aliases initialized at ~/.config/zsh/local/aliases.zsh");
  }
  if (conflictingAliases.size > 0) {
    p.log.warn(`Left ${conflictingAliases.size} aliases that overlap current Suitup aliases in ~/.config/suitup/aliases; review them before removing the legacy file.`);
  }
  if (skippedLines > 0) {
    p.log.warn(`Left ${skippedLines} non-alias lines in ~/.config/suitup/aliases; move them to local/machine.zsh or local/secrets.zsh if still needed.`);
  }

  return {
    changed: !destExists || content !== existing,
    reason: migratedLines.length > 0 ? "migrated" : destExists ? "exists" : "created",
    migratedAliases: migratedLines.map(getAliasName),
    conflictingAliases: conflictingAliases.size,
    skippedLines,
  };
}

/**
 * Set up shell aliases.
 * @param {object} [opts]
 * @param {string} [opts.home] - override home directory (for testing)
 */
export async function setupAliases({ home } = {}) {
  const base = home || homedir();
  const dest = join(base, ".config", "zsh", "shared", "aliases.zsh");
  initializeUserAliases({ home: base });
  ensureDir(join(base, ".config", "zsh", "shared"));
  await applyManagedConfigUpdate({
    source: join(CONFIGS_DIR, "shared", "aliases.zsh"),
    dest,
    label: "aliases",
    home: base,
    redactPreview: redactAliasValues,
  });
}
