#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkNodeVersion } from "./utils/node-version.js";
checkNodeVersion();

import { runSetup } from "./setup.js";
import { runAppend } from "./append.js";
import { runVerify } from "./verify.js";
import { runClean } from "./clean.js";
import { runMigratePaths } from "./migrate-paths.js";
import { getHelpText, resolveCommand } from "./cli-config.js";
import { requireZshShell } from "./utils/shell-context.js";

function exitIfNotZsh(commandLabel) {
  if (!requireZshShell(`suitup ${commandLabel}`)) {
    process.exit(1);
  }
}

export async function main(argv = process.argv) {
  const command = resolveCommand(argv[2]);

  switch (command) {
    case "help":
      console.log(getHelpText());
      break;
    case "setup":
      exitIfNotZsh("setup");
      await runSetup();
      break;
    case "append":
      exitIfNotZsh("append");
      await runAppend();
      break;
    case "verify":
      exitIfNotZsh("verify");
      await runVerify();
      break;
    case "clean":
      exitIfNotZsh("clean");
      await runClean();
      break;
    case "migrate-paths":
      exitIfNotZsh("migrate-paths");
      await runMigratePaths();
      break;
    default:
      console.log(getHelpText());
      process.exit(1);
  }
}

const isDirectRun = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
