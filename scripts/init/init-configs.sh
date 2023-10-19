#!/bin/bash

# 创建配置文件目录
mkdir -p $HOME/.config/suitup

# 定义 plugins 文件的路径
plugin_file="$HOME/.config/suitup/plugins"
# 检查 zshrc 文件中是否已经引用了 plugins 文件
if ! grep -q "source $plugin_file" "$HOME/.zshrc"; then
    prefix_log "create plugins config to .config/zsh" $prefix
    # 如果没有引用，则创建 plugins 文件（如果尚未存在）
    [ -f "$plugin_file" ] || touch "$plugin_file"
    # 并在 zshrc 文件中引用它
    append_to_zshrc "source $plugin_file"
fi

# 定义 aliases 文件的路径
aliases_file="$HOME/.config/suitup/aliases"
# 检查 zshrc 文件中是否已经引用了 aliases 文件
if ! grep -q "source $aliases_file" "$HOME/.zshrc"; then
    prefix_log "create aliases config to .config/zsh" $prefix
    # 如果没有引用，则创建 aliases 文件（如果尚未存在）
    [ -f "$aliases_file" ] || touch "$aliases_file"
    # 并在 zshrc 文件中引用它
    append_to_zshrc "source $aliases_file"
fi

append_to() {
    if [ ! -f "$2" ] || ! grep -q "$1" "$2"; then
        echo "$1" >>"$2"
    fi
}

# 检查内容是否存在并插入 .zshrc
# 两个参数用于关键字匹配，确定是否要新增配置
append_to_zshrc() {
    if [ "$#" -eq 2 ]; then
        if [ ! -f "$HOME/.zshrc"] || ! grep -q "$2" "$HOME/.zshrc"; then
            echo "$1" >>"$HOME/.zshrc"
        fi
    else
        append_to "$1" "$HOME/.zshrc"
    fi
}
