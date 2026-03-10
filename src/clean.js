import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Clean up suitup-managed configurations.
 */
export async function runClean() {
  p.intro(pc.bgRed(pc.white(" Suit up! — Clean ")));

  const confirm = await p.confirm({
    message: "This will remove suitup config files. Continue?",
    initialValue: false,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel("Clean cancelled.");
    return;
  }

  const targets = [
    join(homedir(), ".config", "suitup"),
  ];

  for (const target of targets) {
    if (existsSync(target)) {
      rmSync(target, { recursive: true });
      p.log.success(`Removed ${target.replace(homedir(), "~")}`);
    }
  }

  p.log.info(
    "Note: ~/.zshrc and ~/.config/zsh/ were not removed.\n" +
    "  Remove them manually if needed, or edit ~/.zshrc to remove suitup source lines."
  );

  p.outro("Clean complete.");
}
