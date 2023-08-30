#!/bin/bash

# 创建配置文件目录 
mkdir -p $HOME/.config/zsh

# 定义 plugins 文件的路径
plugin_file="$HOME/.config/zsh/plugins"
# 检查 zshrc 文件中是否已经引用了 plugins 文件
if ! grep -q "source $plugin_file" "$HOME/.zshrc"; then
    prefix_log "create plugins config to .config/zsh" $prefix
    # 如果没有引用，则创建 plugins 文件（如果尚未存在）
    [ -f "$plugin_file" ] || touch "$plugin_file"
    # 并在 zshrc 文件中引用它
    echo "source $plugin_file" >> "$HOME/.zshrc"
fi

# 定义 aliases 文件的路径
aliases_file="$HOME/.config/zsh/aliases"
# 检查 zshrc 文件中是否已经引用了 aliases 文件
if ! grep -q "source $aliases_file" "$HOME/.zshrc"; then
    prefix_log "create aliases config to .config/zsh" $prefix
    # 如果没有引用，则创建 aliases 文件（如果尚未存在）
    [ -f "$aliases_file" ] || touch "$aliases_file"
    # 并在 zshrc 文件中引用它
    echo "source $aliases_file" >> "$HOME/.zshrc"
fi