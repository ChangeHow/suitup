#!/bin/bash
source $(pwd)/scripts/utils/log.sh

set -e

# 删除指定目录下的文件
if [ -d "$HOME/.config/suitup" ]; then
  rm -rf $HOME/.config/suitup
  color_echo GREEN "Removed ~/.config/suitup"
fi

if [ -d "$HOME/.oh-my-zsh" ]; then
  rm -rf $HOME/.oh-my-zsh
  color_echo GREEN "Removed ~/.oh-my-zsh"
fi

# 检查 .zshrc 文件是否存在
if [ -f "$HOME/.zshrc" ]; then
  # 如果存在，则删除它
  rm $HOME/.zshrc
fi

echo "Now you can run $(color_echo YELLOW "sudo chsh -s $(which bash)") and $(color_echo YELLOW "exec bash") to switch shell"
