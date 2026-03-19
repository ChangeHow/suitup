#!/usr/bin/env node

import { checkNodeVersion } from "./utils/node-version.js";
checkNodeVersion();

import { runSetup } from "./setup.js";
import { runAppend } from "./append.js";
import { runVerify } from "./verify.js";
import { runClean } from "./clean.js";
import { runMigratePaths } from "./migrate-paths.js";
import { getHelpText, resolveCommand } from "./cli-config.js";

const command = resolveCommand(process.argv[2]);

switch (command) {
  case "help":
    console.log(getHelpText());
    break;
  case "setup":
    await runSetup();
    break;
  case "append":
    await runAppend();
    break;
  case "verify":
    await runVerify();
    break;
  case "clean":
    await runClean();
    break;
  case "migrate-paths":
    await runMigratePaths();
    break;
  default:
    console.log(getHelpText());
    process.exit(1);
}
