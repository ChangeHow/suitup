# Suit up!

<p align="center">
    <img src="https://github.com/ChangeHow/suitup/blob/main/suitup.mini.png?raw=true"
        height="120">
</p>

<p align="center">
    <a href="README.zh-CN.md">简体中文</a> | English
</p>

Named after Barney's catchphrase from [How I Met Your Mother](https://www.themoviedb.org/tv/1100-how-i-met-your-mother).

## Features

- Interactive TUI powered by [@clack/prompts](https://github.com/bombshell-dev/clack)
- Suitup is zsh-only; run all suitup commands from a zsh session
- Modular step selection — install only what you need
- **Append mode** — add recommended configs to an existing `.zshrc` without replacing it
- **Migrate PATH mode** — move PATH/tool bootstrap lines out of `.zshrc` into `~/.config/zsh/core/paths.zsh`
- **Verify mode** — check your installation integrity
- **Clean mode** — remove suitup config files
- `--help` output for quick command discovery
- Backs up existing zsh startup files to `~/.config/suitup/backups/` before changing shell startup config
- Powerlevel10k is optional; recommended because its async git status stays responsive in large repositories
- Idempotent — safe to run multiple times
- No private/company-specific content — clean, generic configs

## Usage First

### Recommended preflight

Suitup can bootstrap Zsh and Homebrew for you, but the most reliable path is to start after both are already working.

- Recommended: install Zsh first, switch into a Zsh session, then run suitup
- Recommended: install Homebrew first so later package/tool steps run in a known-good environment
- Optional: if you skip either one, keep the `Bootstrap` step selected and let suitup set them up for you
- If your setup stopped halfway, run `node src/cli.js append` to add missing blocks, re-install missing tools tied to those blocks, or switch the prompt preset without replacing your whole `.zshrc`
- When suitup detects existing suitup-managed config or already-installed frontend prerequisites, setup now deselects those completed steps by default so reruns stay focused

### Install and run

When you run suitup locally from the repo, use a zsh session. The curl installer can bootstrap missing prerequisites for you on a fresh machine.

### Quick install via curl

```bash
curl -fsSL https://raw.githubusercontent.com/ChangeHow/suitup/main/install.sh | bash
```

The installer now defaults to `init`, bootstraps missing `zsh` and Node.js/npm when possible, downloads a temporary copy of the repo, runs `npm ci`, and launches suitup inside `zsh`.

`init` is a non-interactive quick-start path that uses recommended defaults:

- bootstrap package manager + zsh when needed
- install the layered zsh config
- install zinit + Powerlevel10k preset
- install recommended CLI tools and frontend tooling
- install recommended GUI apps on macOS
- write shared aliases

You can also pass a specific command to the installer:

```bash
curl -fsSL https://raw.githubusercontent.com/ChangeHow/suitup/main/install.sh | bash -s -- clean
```

If you want append mode directly without the prompt:

```bash
curl -fsSL https://raw.githubusercontent.com/ChangeHow/suitup/main/install.sh | bash -s -- append
```

### Clone locally

```bash
git clone https://github.com/ChangeHow/suitup.git
cd suitup
npm install
node src/cli.js
```

### Commands

| Command | Description |
|---------|-------------|
| `node src/cli.js init` | Non-interactive quick init with recommended defaults |
| `node src/cli.js` | Full interactive setup (default) |
| `node src/cli.js setup` | Same as above |
| `node src/cli.js append` | Append configs to existing `.zshrc` |
| `node src/cli.js migrate-paths` | Migrate PATH-related lines from `.zshrc` to `~/.config/zsh/core/paths.zsh` |
| `node src/cli.js verify` | Verify installation integrity |
| `node src/cli.js clean` | Remove suitup config files |
| `node src/cli.js --help` | Show available commands |

### What each mode does

### Setup (default)

Interactive step-by-step setup with selectable steps:

1. **Bootstrap** — package manager + Zsh
2. **Zsh Config** — creates `~/.config/zsh/` with layered config architecture
3. **Plugin Manager** — zinit (recommended) or skip for native zsh only
4. **Prompt Preset** — Powerlevel10k (recommended) or a basic zsh prompt
5. **CLI Tools** — bat, eza, fzf, fd, zoxide, atuin, ripgrep...
6. **GUI Apps** — iTerm2, Raycast, VS Code, fonts...
7. **Frontend Tools** — fnm, pnpm, git-cz
8. **Shell Aliases** — git, eza, fzf shortcuts
9. **SSH Key** — generate GitHub SSH key
10. **Vim Config** — basic vim setup
11. **Dock Cleanup** — clean macOS Dock

Before suitup updates shell startup config, it backs up existing zsh startup files such as `.zshrc`, `.zprofile`, `.zshenv`, and `.zlogin` to `~/.config/suitup/backups/`.

If you choose Powerlevel10k, suitup keeps prompt loading non-interactive during setup. When `~/.p10k.zsh` is missing, it falls back to a basic prompt until you run `p10k configure` yourself.

Bootstrap details:

- macOS: install Homebrew or skip package manager setup
- Linux: choose `apt-get`, `dnf`, `yum`, `brew`, or skip
- If Homebrew is already installed in a non-default location, suitup now tries common shellenv paths automatically during Zsh startup
- Suitup now also writes a minimal `~/.zshenv` so non-interactive shells can still load shared env vars and PATH setup
- When fnm installs Node.js, suitup keeps both the `fnm` binary and the installed default Node version on PATH so `fnm`, `node`, `npm`, and globally installed CLIs resolve correctly in both interactive and non-interactive shells

### Append

For users who already have a `.zshrc` and want to cherry-pick suitup configs:

```bash
node src/cli.js append
```

Uses idempotent marker blocks (`# >>> suitup/... >>>`) to safely append selected configs and re-run related installers when required tools are missing:

- Suitup aliases
- Zinit plugins
- Powerlevel10k prompt or basic prompt preset (replaces `~/.config/zsh/shared/prompt.zsh`)
- Tool initialization (atuin, fzf, zoxide, fnm)
- Zsh options (history, completion)
- Environment variables
- Startup performance monitor
- FZF configuration

### Verify

```bash
node src/cli.js verify
```

Checks config files (including `~/.zshenv`), CLI tool availability, and zsh syntax validity.

### Migrate PATH entries

For users whose existing `.zshrc` has accumulated `PATH=...`, `brew shellenv`, `cargo/env`, `fnm env`, `NVM_DIR`, `PNPM_HOME`, and similar tool bootstrap lines:

```bash
node src/cli.js migrate-paths
```

This command:

- extracts detected PATH-related lines from `.zshrc`
- appends them to `~/.config/zsh/core/paths.zsh`
- creates a backup in `~/.config/suitup/backups/`
- runs a post-migration Zsh syntax check
- rolls back automatically if validation fails

### Clean

```bash
node src/cli.js clean
```

Attempts a safe uninstall of suitup-managed config:

- restores the latest non-suitup backup of `~/.zshrc` / `~/.zshenv` when available
- removes suitup-generated `~/.config/zsh/` and `~/.config/suitup/` files when they still match shipped templates
- strips `# >>> suitup/... >>>` blocks from an existing `~/.zshrc` if you used `append`
- preserves user-modified files instead of deleting them blindly

### Help

```bash
node src/cli.js --help
```

Prints the command list and available options.

## What suitup installs

### CLI tools

| Tool | Replaces | Description |
|------|----------|-------------|
| [bat](https://github.com/sharkdp/bat) | `cat` | Syntax-highlighted file viewer |
| [eza](https://github.com/eza-community/eza) | `ls` | Modern file listing |
| [fzf](https://github.com/junegunn/fzf) | — | Fuzzy finder |
| [fd](https://github.com/sharkdp/fd) | `find` | Fast file search |
| [atuin](https://github.com/atuinsh/atuin) | `ctrl-r` | Shell history search |
| [zoxide](https://github.com/ajeetdsouza/zoxide) | `cd` | Smart directory jumping |
| [ripgrep](https://github.com/BurntSushi/ripgrep) | `grep` | Fast content search |

### Zsh plugins

- [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)
- [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)
- [powerlevel10k](https://github.com/romkatv/powerlevel10k) theme (optional, pairs well with zinit)

### GUI apps

Selectable during setup: iTerm2, Raycast, VS Code, Itsycal, Monaspace font, and more.

### Frontend toolchain

- [fnm](https://github.com/Schniz/fnm) — Fast Node Manager
- [pnpm](https://pnpm.io/) — Fast, disk-efficient package manager
- [git-cz](https://github.com/streamich/git-cz) — Conventional commits CLI

## Installed file layout

After setup, your shell config looks like:

```
~/.zshrc                          # Thin orchestrator
~/.zshenv                         # Minimal env for non-interactive shells
~/.config/zsh/
  core/
    perf.zsh                      # Startup timing
    env.zsh                       # Environment variables
    paths.zsh                     # PATH + tool bootstrap entries
    options.zsh                   # Zsh shell options
  shared/
    tools.zsh                     # Tool init (fzf, atuin, zoxide, fnm)
    plugins.zsh                   # zinit plugin declarations
    highlighting.zsh              # zsh-syntax-highlighting styles
    aliases.zsh                   # Shared aliases
    completion.zsh                # Native completion setup
    prompt.zsh                    # Prompt/theme (p10k)
  local/
    machine.zsh                   # Machine-specific overrides
    secrets.zsh                   # API keys (create manually, gitignored)
~/.config/suitup/
  config.vim                      # Vim config
```

## Testing

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

Tests run in sandboxed temp directories.

Implementation details and architecture notes live in `AGENTS.md`.

## Requirements

- macOS (full support, tested on Sonoma+)
- Linux (bootstrap package-manager selection supported; most install steps still target Homebrew ecosystem)
- Node.js >= 18 for local repo usage; the curl installer bootstraps it when possible
- Zsh for local repo usage; the curl installer bootstraps it when possible
- Run suitup from a zsh session (`echo $SHELL` should end with `zsh`)

## License

[Apache-2.0](LICENSE)
