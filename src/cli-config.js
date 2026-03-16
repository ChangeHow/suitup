const HELP_FLAGS = new Set(["help", "--help", "-h"]);

export function getHelpText(executable = "node src/cli.js") {
  return `Usage: ${executable} [command] [options]

Commands:
  setup      Full interactive environment setup (default)
  append     Append recommended configs to existing .zshrc
  verify     Verify installation and config integrity
  clean      Remove suitup config files

Options:
  -h, --help Show help`;
}

export function resolveCommand(input) {
  if (!input) {
    return "setup";
  }

  if (HELP_FLAGS.has(input)) {
    return "help";
  }

  return input;
}
