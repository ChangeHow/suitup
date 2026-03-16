# AGENTS

## Purpose

This document is for contributors and coding agents working on `suitup`.
User-facing setup and installation guidance belongs in `README.md`.

## Project Structure

- `src/cli.js` is the main entry point.
- `src/steps/` contains the interactive setup steps.
- `configs/` contains the files copied into the user's home directory.
- `tests/` contains Vitest coverage for setup flows and generated files.

## Zsh Architecture

Suitup generates a thin `~/.zshrc` that only orchestrates loading.
The actual config lives under `~/.config/zsh/`.

### Core files

- `configs/core/perf.zsh`: startup timing helpers and report output
- `configs/core/env.zsh`: shared environment variables
- `configs/core/paths.zsh`: PATH placeholder for user overrides
- `configs/core/options.zsh`: shell and history options

### Shared files

- `configs/shared/tools.zsh`: external tool initialization, including cached init scripts
- `configs/shared/prompt.zsh`: prompt/theme loading

### Local files

- `configs/local/machine.zsh`: machine-specific overrides placeholder
- `~/.config/zsh/local/secrets.zsh` is user-managed and intentionally not shipped by suitup

## Templates

- `configs/zshrc.template` is the default entrypoint.

The template should keep the same loading order unless there is a strong reason to diverge:

1. perf
2. env
3. paths
4. options
5. tools
6. plugin manager
7. suitup-managed additions
8. local overrides
9. prompt
10. timing report

## Step Behavior

`src/steps/zsh-config.js` is responsible for:

- creating `~/.config/zsh/core`, `shared`, and `local`
- copying shipped config files without overwriting user-modified files
- generating `.zshrc` from the selected template
- backing up an existing non-suitup `.zshrc` before overwrite

This step must remain idempotent.

## Testing Notes

- Run `npm test` for the full suite.
- Zsh config tests live in `tests/zsh-config-steps.test.js`.
- Tests should verify generated structure and important config content, not just file existence.
- Avoid asserting machine/tool-specific PATH details in setup tests; keep assertions focused on suitup-managed behavior.
- Prefer sandboxed home directories over touching real user files.

## Documentation Split

- `README.md`: end-user usage, installed tools, resulting file layout
- `AGENTS.md`: implementation details, architecture, contributor guidance
