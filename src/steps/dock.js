import * as p from "@clack/prompts";
import { runStream } from "../utils/shell.js";

/**
 * Clean up macOS Dock — remove default items and set preferences.
 */
export async function cleanDock() {
  const shouldClean = await p.confirm({
    message: "This will reset your Dock (remove all pinned apps and restart Dock). Continue?",
    initialValue: false,
  });

  if (p.isCancel(shouldClean) || !shouldClean) {
    p.log.info("Dock cleanup skipped");
    return;
  }

  p.log.step("Cleaning macOS Dock...");
  try {
    await runStream(
      'defaults write com.apple.dock persistent-apps -array && ' +
      'defaults write com.apple.dock mineffect -string "genie" && ' +
      'defaults write com.apple.dock largesize -int 90 && ' +
      'killall Dock'
    );
    p.log.success("Dock cleaned and restarted");
  } catch {
    p.log.warn("Could not clean Dock");
  }
}
