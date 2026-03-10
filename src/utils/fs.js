import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  copyFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

/**
 * Ensure a directory exists (recursive).
 */
export function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write a file only if it does not already exist.
 * Returns true if the file was written, false if it already existed.
 */
export function writeIfNotExists(filePath, content) {
  ensureDir(dirname(filePath));
  if (existsSync(filePath)) return false;
  writeFileSync(filePath, content, "utf-8");
  return true;
}

/**
 * Overwrite a file (creates parent dirs as needed).
 */
export function writeFile(filePath, content) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, "utf-8");
}

/**
 * Read a file, returning empty string if it does not exist.
 */
export function readFileSafe(filePath) {
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf-8");
}

/**
 * Append a line to a file if the file does not already contain
 * the given marker string. Uses suitup markers for idempotency.
 *
 * @param {string} filePath - target file
 * @param {string} content  - content block to append
 * @param {string} marker   - unique marker to detect duplicates
 * @returns {boolean} true if content was appended
 */
export function appendIfMissing(filePath, content, marker) {
  ensureDir(dirname(filePath));
  const existing = readFileSafe(filePath);
  if (existing.includes(marker)) return false;

  const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  appendFileSync(filePath, separator + content + "\n", "utf-8");
  return true;
}

/**
 * Copy a file, creating destination parent dirs as needed.
 */
export function copyFile(src, dest) {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
}

/**
 * Copy a file only if the destination does not already exist.
 * Returns true if copied, false if skipped.
 */
export function copyIfNotExists(src, dest) {
  ensureDir(dirname(dest));
  if (existsSync(dest)) return false;
  copyFileSync(src, dest);
  return true;
}

/**
 * Resolve ~ and $HOME in a path.
 */
export function expandHome(p) {
  return p.replace(/^~/, homedir()).replace(/\$HOME/g, homedir());
}

/**
 * Get the suitup project root (where configs/ lives).
 */
export function projectRoot() {
  return join(import.meta.dirname, "..", "..");
}
