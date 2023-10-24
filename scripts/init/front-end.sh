#!/bin/bash
source $(pwd)/scripts/utils/log.sh

# 检查 'volta' 命令是否存在
if ! command -v volta &> /dev/null
then
    color_echo GREEN "[fe] Volta could not be found"
    color_echo YELLOW "[fe] Installing Volta..."
    # 在这里添加安装 Volta 的命令，比如：
    curl https://get.volta.sh | bash
else
    color_echo GREEN "[fe] Volta is already installed"
fi

# init node@16 & pnpm
color_echo YELLOW "[fe] install node@16 and pnpm@7..."
volta install node@16
volta install pnpm@7

if [[ $* == *--no-tools* ]]; then
  color_echo GREEN "[fe] skip installing tools chain"
else
  color_echo YELLOW "[fe] install tools chain..."
  volta install eslint
  volta install prettier
  volta install stylelint
  volta install typescript@4.8
  volta install ts-node
  volta install husky
fi

# git commitizen
color_echo YELLOW "[fe] init git commitizen..."
volta install commitizen
volta install cz-conventional-changelog
touch ~/.czrc
color_echo YELLOW '{ "path": "cz-conventional-changelog" }' > ~/.czrc

color_echo GREEN "[fe] done!"
