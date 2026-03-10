import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Create a temporary sandbox directory for testing.
 * Returns { path, cleanup } where cleanup removes the sandbox.
 */
export function createSandbox() {
  const path = mkdtempSync(join(tmpdir(), "suitup-test-"));
  return {
    path,
    cleanup() {
      rmSync(path, { recursive: true, force: true });
    },
  };
}
