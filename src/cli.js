#!/usr/bin/env node

import { checkNodeVersion } from "./utils/node-version.js";
checkNodeVersion();

import { runSetup } from "./setup.js";
import { runAppend } from "./append.js";
import { runVerify } from "./verify.js";
import { runClean } from "./clean.js";

const command = process.argv[2] || "setup";

switch (command) {
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
  default:
    console.log(`Usage: node src/cli.js [setup|append|verify|clean]

Commands:
  setup   Full interactive environment setup (default)
  append  Append recommended configs to existing .zshrc
  verify  Verify installation and config integrity
  clean   Remove suitup config files`);
    process.exit(1);
}
