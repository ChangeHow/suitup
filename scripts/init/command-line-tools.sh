#!/bin/bash
source $(pwd)/scripts/utils/log.sh
source $(pwd)/scripts/init/init-configs.sh

prefix="cli"

# 检查 brew 是否安装
prefix_log "checking homebrew installation status" $prefix
if ! command -v brew &>/dev/null; then
    prefix_log "brew could not be found. Please install Homebrew." $prefix
    exit
fi

prefix_log "checking git installation status" $prefix
# 检查 git 是否安装
if ! command -v git &>/dev/null; then
    prefix_log "git could not be found. Please install git." $prefix
    exit
fi

prefix_log "autojump..." $prefix
if brew list autojump &>/dev/null; then
    prefix_log "autojump is already installed." $prefix
else
    brew install autojump
fi
# 检查内容并添加配置
color_echo BLUE ">>> checking and append the init script for autojump to ~/.zshrc"
append_to_zshrc "[ -f /opt/homebrew/etc/profile.d/autojump.sh ] && . /opt/homebrew/etc/profile.d/autojump.sh"
color_echo GREEN "You can use 'j' and jump to whatever dir you've visited"

prefix_log "bat..." $prefix
# 使用 brew 安装 bat
if brew list bat &>/dev/null; then
    prefix_log "bat is already installed." $prefix
else
    brew install bat
fi

prefix_log "htop..." $prefix
if brew list htop &>/dev/null; then
    prefix_log "htop is already installed." $prefix
else
    brew install htop
fi

prefix_log "neofetch..." $prefix
if brew list neofetch &>/dev/null; then
    prefix_log "neofetch is already installed." $prefix
else
    brew install neofetch
fi

prefix_log "eza..., a replacement of ls" $prefix
if brew list eza &>/dev/null; then
    prefix_log "eza is already installed." $prefix
else
    brew install eza
    prefix_log "replace ls with eza" $prefix
fi

prefix_log "install atuin..." $prefix
if brew list atuin &>/dev/null; then
    prefix_log "atuin is already installed." $prefix
else
    brew install atuin
fi
# 检查内容并添加配置
color_echo BLUE ">>> checking and append the init script for atuin o ~/.zshrc"
append_to_zshrc 'eval "$(atuin init zsh --disable-ctrl-r)"'
color_echo GREEN "You can use '↑(Arrow up)' to browser history with fuzzy search and using '<C-j>/<C-k>' to navigate."

prefix_log "install fzf..." $prefix
if brew list fzf &>/dev/null; then
    prefix_log "fzf is already installed." $prefix
else
    brew install fzf
    brew install ripgrep
fi
# 检查内容并添加配置
color_echo BLUE ">>> checking and append the init script for fzf o ~/.zshrc"
# To install useful key bindings and fuzzy completion:
$(brew --prefix)/opt/fzf/install
append_to_zshrc "export FZF_CTRL_T_OPTS=\"--ansi --preview-window 'right:60%' --preview '[[ -d {} ]] && echo 'Directory' || bat --color=always --style=header,grid --line-range :300 {}'\"" "FZF_CTRL_T_OPTS"
append_to_zshrc "export FZF_DEFAULT_COMMAND=\"rg --files --no-ignore --hidden --follow --glob '!.git/*'\"" "FZF_DEFAULT_COMMAND"

prefix_log "install tree..." $prefix
if brew list tree &>/dev/null; then
    prefix_log "tree is already installed." $prefix
else
    brew install tree
fi

prefix_log "finished installation!" $prefix

prefix_log "reload zsh" $prefix
exec zsh

color_echo GREEN "Done."
