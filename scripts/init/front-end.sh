#!/bin/bash
source $(pwd)/scripts/utils/log.sh
source $(pwd)/scripts/init/init-configs.sh

# 检查 'volta' 命令是否存在
if command -v volta &> /dev/null; then
    color_echo GREEN "[fe] Volta is already installed"

    # init node@16 & pnpm
    color_echo YELLOW "[fe] install node@16 and pnpm@7..."
    volta install node@16
    volta install pnpm@7

    color_echo GREEN "[fe] enable pnpm support for volta"
    append_to_zshrc "export VOLTA_FEATURE_PNPM=1" "VOLTA_FEATURE_PNPM" # support pnpm

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
    color_echo GREEN "[fe] set cz config to ~/.czrc"
    echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc

    color_echo GREEN "[fe] done!"
else
    color_echo GREEN "[fe] Volta could not be found"
    color_echo YELLOW "[fe] Installing Volta..."
    curl https://get.volta.sh | bash
    color_echo YELLOW "[fe] re-run this script to finish the installation"
    exec zsh
fi
