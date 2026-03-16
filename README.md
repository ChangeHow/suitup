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
- Setup is intentionally zsh-first; run suitup from zsh before initialization
- Modular step selection — install only what you need
- **Append mode** — add recommended configs to an existing `.zshrc` without replacing it
- **Verify mode** — check your installation integrity
- **Clean mode** — remove suitup config files
- `--help` output for quick command discovery
- Backs up existing shell rc files to `~/.config/suitup/backups/` before changing shell startup config
- Powerlevel10k is optional; recommended because its async git status stays responsive in large repositories
- Idempotent — safe to run multiple times
- No private/company-specific content — clean, generic configs

## Usage First

### Install and run

```bash
git clone https://github.com/ChangeHow/suitup.git
cd suitup
npm install
node src/cli.js
```

### Commands

| Command | Description |
|---------|-------------|
| `node src/cli.js` | Full interactive setup (default) |
| `node src/cli.js setup` | Same as above |
| `node src/cli.js append` | Append configs to existing `.zshrc` |
| `node src/cli.js verify` | Verify installation integrity |
| `node src/cli.js clean` | Remove suitup config files |
| `node src/cli.js --help` | Show available commands |

### What each mode does

### Setup (default)

Interactive step-by-step setup with selectable steps:

1. **Bootstrap** — package manager + Zsh
2. **Zsh Config** — creates `~/.config/zsh/` with layered config architecture
3. **Plugin Manager** — zinit (recommended) or Oh My Zsh
4. **Prompt Preset** — Powerlevel10k (recommended) or a basic zsh prompt
5. **CLI Tools** — bat, eza, fzf, fd, zoxide, atuin, ripgrep...
6. **GUI Apps** — iTerm2, Raycast, VS Code, fonts...
7. **Frontend Tools** — fnm, pnpm, git-cz
8. **Shell Aliases** — git, eza, fzf shortcuts
9. **SSH Key** — generate GitHub SSH key
10. **Vim Config** — basic vim setup
11. **Dock Cleanup** — clean macOS Dock

Before suitup updates shell startup config, it backs up existing shell rc files such as `.zshrc`, `.zprofile`, `.bashrc`, and `.bash_profile` to `~/.config/suitup/backups/`.

If you choose Powerlevel10k, suitup keeps prompt loading non-interactive during setup. When `~/.p10k.zsh` is missing, it falls back to a basic prompt until you run `p10k configure` yourself.

Bootstrap details:

- macOS: install Homebrew or skip package manager setup
- Linux: choose `apt-get`, `dnf`, `yum`, `brew`, or skip

### Append

For users who already have a `.zshrc` and want to cherry-pick suitup configs:

```bash
node src/cli.js append
```

Uses idempotent marker blocks (`# >>> suitup/... >>>`) to safely append selected configs:

- Suitup aliases
- Zinit plugins
- Tool initialization (atuin, fzf, zoxide, fnm)
- Zsh options (history, completion)
- Environment variables
- Startup performance monitor
- FZF configuration

### Verify

```bash
node src/cli.js verify
```

Checks config files, CLI tool availability, and shell syntax validity.

### Clean

```bash
node src/cli.js clean
```

Removes `~/.config/suitup/`. Does NOT remove `~/.zshrc` or `~/.config/zsh/` — remove those manually if needed.

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
- [powerlevel10k](https://github.com/romkatv/powerlevel10k) theme (optional, recommended)

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
~/.config/zsh/
  core/
    perf.zsh                      # Startup timing
    env.zsh                       # Environment variables
    paths.zsh                     # PATH placeholder
    options.zsh                   # Zsh shell options
  shared/
    tools.zsh                     # Tool init (fzf, atuin, zoxide, fnm)
    prompt.zsh                    # Prompt/theme (p10k)
  local/
    machine.zsh                   # Machine-specific overrides
    secrets.zsh                   # API keys (create manually, gitignored)
~/.config/suitup/
  aliases                         # Shell aliases
  zinit-plugins                   # Zinit plugin config
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
- Node.js >= 18
- Zsh (default shell on macOS)

## License

[Apache-2.0](LICENSE)
