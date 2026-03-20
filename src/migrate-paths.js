import * as p from "@clack/prompts";
import pc from "picocolors";
import { homedir } from "node:os";
import { migratePaths } from "./steps/migrate-paths.js";

/**
 * CLI entry point for the migrate-paths command.
 */
export async function runMigratePaths() {
  p.intro(pc.bgBlue(pc.white(" Suit up! — Migrate Paths ")));

  try {
    const result = await migratePaths();

    if (result.migrated === 0) {
      p.log.info("No PATH-related lines found in .zshrc to migrate.");
      p.outro("Nothing to do.");
      return;
    }

    p.log.success(`Migrated ${result.migrated} PATH-related line(s) to ~/.config/zsh/core/paths.zsh`);

    for (const line of result.pathLines) {
      p.log.info(`  ${pc.dim(line)}`);
    }

    if (result.backupDir) {
      p.log.info(`Backup saved to ${result.backupDir.replace(homedir(), "~")}`);
    }

    p.outro(`Done! Run ${pc.cyan("exec zsh")} to reload your shell.`);
  } catch (err) {
    p.log.error(err.message);
    p.outro("Migration failed.");
    process.exit(1);
  }
}
