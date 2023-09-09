#!/bin/zsh
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
    echo "[ -f /opt/homebrew/etc/profile.d/autojump.sh ] && . /opt/homebrew/etc/profile.d/autojump.sh" >>~/.zshrc
fi

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

prefix_log "postman..." $prefix
if brew list postman &>/dev/null; then
    prefix_log "postman is already installed." $prefix
else
    brew install --cask postman
fi

prefix_log "exa..., a replacement of ls" $prefix
if brew list exa &>/dev/null; then
    prefix_log "exa is already installed." $prefix
else
    brew install exa
    prefix_log "replace ls with exa" $prefix
fi

prefix_log "install atuin..." $prefix
if brew list atuin &>/dev/null; then
    prefix_log "atuin is already installed." $prefix
else
    brew install atuin
    echo 'eval "$(atuin init zsh --disable-ctrl-r)"' >>$HOME/.zshrc
fi

prefix_log "install fzf..." $prefix
if brew list fzf &>/dev/null; then
    prefix_log "fzf is already installed." $prefix
else
    brew install fzf
    brew install ripgrep
    # To install useful key bindings and fuzzy completion:
    $(brew --prefix)/opt/fzf/install
    echo "export FZF_DEFAULT_COMMAND='rg --files --no-ignore --hidden --follow --glob \"!{**/node_modules/*,.git/*,*/tmp/*}\"'" >>$HOME/.zshrc
    prefix_log "you can use <C-r> to search file fuzzyly" $prefix
fi

prefix_log "install volta..." $prefix
curl https://get.volta.sh | bash

prefix_log "finished installation!" $prefix

prefix_log "reload zsh" $prefix
exec zsh

echo "Done."
