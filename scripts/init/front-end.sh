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
volta install node@16
volta install pnpm@7

# git commitizen
echo "[fe] init git commitizen..."
volta install commitizen
volta install cz-conventional-changelog
touch ~/.czrc
echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc
