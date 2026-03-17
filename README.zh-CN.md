# Suit up!

<p align="center">
    <img src="https://github.com/ChangeHow/suitup/blob/main/suitup.mini.png?raw=true"
        height="120">
</p>

<p align="center">
    简体中文 | <a href="README.md">English</a>
</p>

名字取自 [老爸老妈的浪漫史](https://www.themoviedb.org/tv/1100-how-i-met-your-mother) 中 Barney 的口头禅。

## 特性

- 基于 [@clack/prompts](https://github.com/bombshell-dev/clack) 的交互式终端界面
- 初始化流程以 zsh 为前提，需先在 zsh 中运行 suitup
- 模块化步骤选择，只安装你需要的内容
- **追加模式**：向现有 `.zshrc` 追加推荐配置，不强制覆盖
- **验证模式**：检查安装完整性
- **清理模式**：删除 suitup 生成的配置
- 提供 `--help`，方便快速查看命令
- 修改 Shell 启动配置前，会先把现有 rc 文件备份到 `~/.config/suitup/backups/`
- Powerlevel10k 为可选项；推荐开启，因为它在大型 Git 仓库里的异步 git 状态会更流畅
- 幂等执行，可安全重复运行
- 不包含私有/公司特定内容

## 用法优先

### 推荐前置准备

Suitup 可以帮你初始化 Zsh 和 Homebrew，但更稳妥的路径仍然是先把它们准备好再继续。

- 推荐：先安装 Zsh，并切到 Zsh 会话里再运行 suitup
- 推荐：先安装 Homebrew，这样后续包管理和工具安装会更稳定
- 可选：如果你不想手动准备，也可以保留 `Bootstrap` 步骤，让 suitup 代为安装
- 如果初始化做到一半中断了，可以运行 `node src/cli.js append` 继续补齐缺失配置，或者切换 prompt 预设，而不必整体重写 `.zshrc`

### 安装并运行

```bash
git clone https://github.com/ChangeHow/suitup.git
cd suitup
npm install
node src/cli.js
```

### 命令

| 命令 | 说明 |
|------|------|
| `node src/cli.js` | 完整交互式安装（默认） |
| `node src/cli.js setup` | 同上 |
| `node src/cli.js append` | 追加配置到已有 `.zshrc` |
| `node src/cli.js verify` | 验证安装完整性 |
| `node src/cli.js clean` | 删除 suitup 配置文件 |
| `node src/cli.js --help` | 显示可用命令 |

### 模式说明

### Setup（默认）

交互式步骤如下：

1. **Bootstrap** — 包管理器 + Zsh（macOS 可安装/跳过 Homebrew；Linux 可选 apt-get/dnf/yum/brew/跳过）
2. **Zsh Config** — 创建 `~/.config/zsh/` 分层结构
3. **Plugin Manager** — zinit（推荐）或跳过，仅保留原生 zsh
4. **Prompt Preset** — Powerlevel10k（推荐）或基础 zsh prompt
5. **CLI Tools** — bat、eza、fzf、fd、zoxide、atuin、ripgrep 等
6. **GUI Apps** — iTerm2、Raycast、VS Code、字体等
7. **Frontend Tools** — fnm、pnpm、git-cz
8. **Shell Aliases** — git、eza、fzf 等快捷命令
9. **SSH Key** — 生成 GitHub SSH 密钥
10. **Vim Config** — 基础 Vim 配置
11. **Dock Cleanup** — 清理 macOS Dock

在 suitup 修改 Shell 启动配置前，会先把现有 `.zshrc`、`.zprofile`、`.bashrc`、`.bash_profile` 等文件备份到 `~/.config/suitup/backups/`。

如果你选择 Powerlevel10k，suitup 会保持安装过程非交互；当缺少 `~/.p10k.zsh` 时，会先回退到基础 prompt，等你之后自行运行 `p10k configure` 再启用。

Bootstrap 细节：

- macOS：安装 Homebrew，或跳过包管理器初始化
- Linux：可选 `apt-get`、`dnf`、`yum`、`brew`，或直接跳过
- 如果 Homebrew 已经安装在非默认位置，suitup 现在会在 Zsh 启动时自动尝试常见 `shellenv` 路径

### Append（追加）

适用于已有 `.zshrc`，想按需接入 suitup 配置：

```bash
node src/cli.js append
```

通过幂等标记块（`# >>> suitup/... >>>`）安全追加：

- aliases
- zinit 插件
- Powerlevel10k prompt 或基础 prompt 预设（会替换 `~/.config/zsh/shared/prompt.zsh`）
- 工具初始化（atuin/fzf/zoxide/fnm）
- Zsh 选项（history/completion）
- 环境变量
- 启动性能报告
- FZF 配置

### Verify（验证）

```bash
node src/cli.js verify
```

检查配置文件、CLI 可用性、Shell 语法。

### Clean（清理）

```bash
node src/cli.js clean
```

删除 `~/.config/suitup/`。不会删除 `~/.zshrc` 与 `~/.config/zsh/`。

### Help（帮助）

```bash
node src/cli.js --help
```

输出命令列表和可用选项。

## suitup 会安装什么

### CLI 工具

| 工具 | 替代 | 说明 |
|------|------|------|
| [bat](https://github.com/sharkdp/bat) | `cat` | 带语法高亮的文件查看器 |
| [eza](https://github.com/eza-community/eza) | `ls` | 现代文件列表 |
| [fzf](https://github.com/junegunn/fzf) | — | 模糊搜索 |
| [fd](https://github.com/sharkdp/fd) | `find` | 快速文件搜索 |
| [atuin](https://github.com/atuinsh/atuin) | `ctrl-r` | Shell 历史搜索 |
| [zoxide](https://github.com/ajeetdsouza/zoxide) | `cd` | 智能目录跳转 |
| [ripgrep](https://github.com/BurntSushi/ripgrep) | `grep` | 快速内容搜索 |

### Zsh 插件

- [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)
- [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)
- [powerlevel10k](https://github.com/romkatv/powerlevel10k) 主题（可选，适合配合 zinit）

### GUI 应用

可在安装过程中选择：iTerm2、Raycast、VS Code、Itsycal、Monaspace 字体等。

### 前端工具链

- [fnm](https://github.com/Schniz/fnm) — Node 版本管理
- [pnpm](https://pnpm.io/) — 高性能包管理器
- [git-cz](https://github.com/streamich/git-cz) — Conventional Commits CLI

## 安装后的目录结构

```text
~/.zshrc                          # 轻量入口
~/.config/zsh/
  core/
    perf.zsh                      # 启动计时
    env.zsh                       # 环境变量
    paths.zsh                     # PATH 预留文件
    options.zsh                   # Zsh 选项
  shared/
    tools.zsh                     # 工具初始化（带缓存）
    prompt.zsh                    # 提示符主题
  local/
    machine.zsh                   # 机器本地覆盖
    secrets.zsh                   # 个人密钥（手动创建）
~/.config/suitup/
  aliases                         # Shell aliases
  zinit-plugins                   # Zinit 插件配置
  config.vim                      # Vim 配置
```

## 系统要求

- Node.js >= 18
- Zsh
- macOS（完整支持）
- Linux（支持 bootstrap 包管理器选择；其余安装步骤当前仍以 Homebrew 生态为主）

## 测试

```bash
npm test
npm run test:watch
```

## 许可证

[Apache-2.0](LICENSE)
