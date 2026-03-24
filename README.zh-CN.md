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
- suitup 只支持 zsh；所有命令都需要在 zsh 会话中运行
- 模块化步骤选择，只安装你需要的内容
- **追加模式**：向现有 `.zshrc` 追加推荐配置，不强制覆盖
- **PATH 迁移模式**：把 `.zshrc` 里的 PATH / 工具初始化行迁移到 `~/.config/zsh/core/paths.zsh`
- **验证模式**：检查安装完整性
- **清理模式**：删除 suitup 生成的配置
- 提供 `--help`，方便快速查看命令
- 修改 Shell 启动配置前，会先把现有 zsh 启动文件备份到 `~/.config/zsh/backups/`
- Powerlevel10k 为可选项；推荐开启，因为它在大型 Git 仓库里的异步 git 状态会更流畅
- 幂等执行，可安全重复运行
- 不包含私有/公司特定内容

## 用法优先

### 推荐前置准备

Suitup 可以帮你初始化 Zsh 和 Homebrew，但更稳妥的路径仍然是先把它们准备好再继续。

- 推荐：先安装 Zsh，并切到 Zsh 会话里再运行 suitup
- 推荐：先安装 Homebrew，这样后续包管理和工具安装会更稳定
- 可选：如果你不想手动准备，也可以保留 `Bootstrap` 步骤，让 suitup 代为安装
- 如果初始化做到一半中断了，可以运行 `node src/cli.js append` 继续补齐缺失配置、重试安装这些配置依赖的工具，或者切换 prompt 预设，而不必整体重写 `.zshrc`
- 如果 suitup 检测到本地已经存在 suitup 管理的配置，或者前端工具链已经装好，setup 现在会默认把这些已完成步骤反选掉，方便你只补剩余内容

### 安装并运行

在本地从仓库运行 suitup 时，请使用 zsh 会话。curl 安装脚本可以在全新机器上自动补全缺少的依赖。

### 通过 curl 快速安装

```bash
curl -fsSL https://raw.githubusercontent.com/ChangeHow/suitup/main/install.sh | bash
```

安装脚本会在必要时自动安装 `zsh` 和 Node.js/npm，临时下载仓库，执行 `npm ci`，然后询问你想要交互式 `setup` 还是非交互式 `init`，再在 `zsh` 中启动对应流程。

你也可以直接传入命令来跳过询问：

```bash
curl -fsSL https://raw.githubusercontent.com/ChangeHow/suitup/main/install.sh | bash -s -- init
```

`init` 是非交互式快速初始化路径，使用推荐默认值：

- 按需安装包管理器和 zsh
- 安装分层 zsh 配置
- 安装 zinit + Powerlevel10k 预设
- 安装推荐 CLI 工具和前端工具链
- 在 macOS 上安装推荐 GUI 应用
- 写入共享 aliases
- 最后运行 `p10k configure` 完成提示符主题配置

你也可以传入其他命令：

```bash
curl -fsSL https://raw.githubusercontent.com/ChangeHow/suitup/main/install.sh | bash -s -- clean
```

如果想直接进入 append 模式：

```bash
curl -fsSL https://raw.githubusercontent.com/ChangeHow/suitup/main/install.sh | bash -s -- append
```

### 本地 clone 运行

```bash
git clone https://github.com/ChangeHow/suitup.git
cd suitup
npm install
node src/cli.js
```

### 命令

| 命令 | 说明 |
|------|------|
| `node src/cli.js init` | 非交互式快速初始化，使用推荐默认值 |
| `node src/cli.js` | 完整交互式安装（默认） |
| `node src/cli.js setup` | 同上 |
| `node src/cli.js append` | 追加配置到已有 `.zshrc` |
| `node src/cli.js migrate-paths` | 将 `.zshrc` 中的 PATH 相关配置迁移到 `~/.config/zsh/core/paths.zsh` |
| `node src/cli.js verify` | 验证安装完整性 |
| `node src/cli.js clean` | 删除 suitup 配置文件 |
| `node src/cli.js --help` | 显示可用命令 |

### 模式说明

### Setup（默认）

交互式步骤如下：

1. **Bootstrap** — 包管理器 + Zsh
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

在 suitup 修改 Shell 启动配置前，会先把现有 `.zshrc`、`.zprofile`、`.zshenv`、`.zlogin` 等 zsh 启动文件备份到 `~/.config/zsh/backups/`。

如果你选择 Powerlevel10k，suitup 会保持安装过程非交互；当缺少 `~/.p10k.zsh` 时，会先回退到基础 prompt，等你之后自行运行 `p10k configure` 再启用。

Bootstrap 细节：

- macOS：安装 Homebrew，或跳过包管理器初始化
- Linux：可选 `apt-get`、`dnf`、`yum`、`brew`，或直接跳过
- 如果 Homebrew 已经安装在非默认位置，suitup 会在 Zsh 启动时自动尝试常见 `shellenv` 路径
- suitup 也会生成一个精简的 `~/.zshenv`，保证非交互式 shell 也能加载共享环境变量和 PATH
- 当 fnm 安装 Node.js 后，suitup 会把 `fnm` 自身和该默认 Node 版本一起放进 PATH，确保交互式/非交互式 shell 下的 `fnm`、`node`、`npm` 和全局 CLI 都能正确解析

### Append（追加）

适用于已有 `.zshrc`，想按需接入 suitup 配置：

```bash
node src/cli.js append
```

通过幂等标记块（`# >>> suitup/... >>>`）安全追加；如果相关工具缺失，也会一起重试安装：

- aliases
- zinit 插件
- Powerlevel10k prompt 或基础 prompt 预设（会替换 `~/.config/zsh/shared/prompt.zsh`）
- 工具初始化（atuin、fzf、zoxide、fnm）
- Zsh 选项（history/completion）
- 环境变量
- 启动性能报告
- FZF 配置

### Verify（验证）

```bash
node src/cli.js verify
```

检查配置文件（包含 `~/.zshenv`）、CLI 可用性，以及 zsh 语法。

### Migrate PATH（迁移 PATH）

适用于已有 `.zshrc`，并且里面已经堆积了 `PATH=...`、`brew shellenv`、`cargo/env`、`fnm env`、`NVM_DIR`、`PNPM_HOME` 等 PATH / 工具初始化配置：

```bash
node src/cli.js migrate-paths
```

该命令会：

- 从 `.zshrc` 中提取识别到的 PATH 相关配置
- 追加到 `~/.config/zsh/core/paths.zsh`
- 先创建 `~/.config/zsh/backups/` 备份
- 迁移后执行 Zsh 语法检查
- 如果校验失败则自动回滚

### Clean（清理）

```bash
node src/cli.js clean
```

尽量安全地卸载 suitup 管理的配置：

- 若存在备份，优先恢复最近一次"非 suitup 版本"的 `~/.zshrc` / `~/.zshenv`
- 对仍与项目模板一致的文件，删除 `~/.config/zsh/` 下的 suitup 生成内容
- 如果你用过 `append`，会从现有 `~/.zshrc` 中移除 `# >>> suitup/... >>>` 标记块
- 对用户自己改过的文件会保留，不会盲删

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

```
~/.zshrc                          # 轻量入口
~/.zshenv                         # 非交互式 shell 的最小环境入口
~/.config/zsh/
  core/
    perf.zsh                      # 启动计时
    env.zsh                       # 环境变量
    paths.zsh                     # PATH 与工具引导配置
    options.zsh                   # Zsh 选项
  shared/
    tools.zsh                     # 工具初始化编排入口
    tools/
      _loader.zsh                 # _load_tool_config() + 版本化缓存
      fzf.zsh                     # FZF 环境变量、初始化、Ctrl-T 组件
      runtime.zsh                 # zoxide + fnm
      atuin.zsh                   # Atuin 历史（占用 Ctrl-R）
      bun.zsh                     # Bun 异步补全
    plugins.zsh                   # zinit 插件声明
    highlighting.zsh              # zsh-syntax-highlighting 样式
    aliases.zsh                   # 共享 aliases
    completion.zsh                # 原生补全配置
    prompt.zsh                    # 提示符主题（p10k）
  local/
    machine.zsh                   # 机器本地覆盖
    config.vim                    # Vim 配置
    secrets.zsh                   # 个人密钥（手动创建，不纳入 git）
```

## 测试

```bash
npm test           # 运行全套测试
npm run test:watch # 监视模式
```

测试在沙箱临时目录中运行。

实现细节和架构说明见 `AGENTS.md`。

## 系统要求

- macOS（完整支持，在 Sonoma+ 上测试）
- Linux（支持 bootstrap 包管理器选择；其余安装步骤当前仍以 Homebrew 生态为主）
- 本地运行需要 Node.js >= 18；curl 安装脚本会在可能时自动安装
- 本地运行需要 Zsh；curl 安装脚本会在可能时自动安装
- 需要在 zsh 会话中运行 suitup（`echo $SHELL` 结果应以 `zsh` 结尾）

## 许可证

[Apache-2.0](LICENSE)
