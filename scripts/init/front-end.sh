#!/bin/bash

# 检查 'volta' 命令是否存在
if ! command -v volta &> /dev/null
then
    echo "[fe] Volta could not be found"
    echo "[fe] Installing Volta..."
    # 在这里添加安装 Volta 的命令，比如：
    curl https://get.volta.sh | bash
else
    echo "[fe] Volta is already installed"
fi

# init node@16 & pnpm
echo "[fe] install node@16 and pnpm@7..."
volta install node@16
volta install pnpm@7

if [[ $* == *--no-tools* ]]; then
  echo "[fe] skip installing tools chain"
else
  echo "[fe] install tools chain..."
  volta install eslint
  volta install prettier
  volta install stylelint
  volta install typescript@4.8
  volta install ts-node
  volta install husky
fi

# git commitizen
echo "[fe] init git commitizen..."
volta install commitizen
volta install cz-conventional-changelog
touch ~/.czrc
echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc

echo "[fe] done!"
