#!/bin/bash
source $(pwd)/scripts/utils/log.sh
source $(pwd)/scripts/init/init-configs.sh

# 获取最新的 Node.js LTS 版本
color_echo YELLOW "[fe] fetching latest Node.js LTS version..."
NODE_LTS_VERSION=$(curl -sf https://nodejs.org/dist/index.json | jq -r '[.[] | select(.lts != false)][0].version' | sed 's/^v//')

if [ -z "$NODE_LTS_VERSION" ]; then
  color_echo YELLOW "[fe] failed to fetch latest Node.js LTS version, using default version 18"
  NODE_LTS_VERSION="18"
else
  color_echo GREEN "[fe] Latest Node.js LTS version: $NODE_LTS_VERSION"
fi


# 询问用户选择 node 版本管理器
echo "Which Node.js version manager would you prefer to use?"
echo "1) Volta"
echo "2) Fast Node Manager (fnm)"
read -p "Please enter 1 or 2: " choice

# 初始化安装命令变量
if [ "$choice" = "1" ]; then
    INSTALL_CMD="volta install"
    NODE_INSTALL_CMD="volta install node@${NODE_LTS_VERSION#v}"  # 移除版本号前的 'v'
else
    INSTALL_CMD="npm install -g"
    NODE_INSTALL_CMD="fnm install ${NODE_LTS_VERSION} && fnm use ${NODE_LTS_VERSION}"
fi

case $choice in
    1)
        # Volta 安装逻辑
        if command -v volta &> /dev/null; then
            color_echo GREEN "[fe] Volta is already installed"
        else
            color_echo GREEN "[fe] Volta could not be found"
            color_echo YELLOW "[fe] Installing Volta..."
            curl https://get.volta.sh | bash
            color_echo YELLOW "[fe] re-run this script to finish the installation"
            exec zsh
            exit 0
        fi

        color_echo GREEN "[fe] enable pnpm support for volta"
        append_to_zshrc "export VOLTA_FEATURE_PNPM=1" "VOLTA_FEATURE_PNPM" # support pnpm
        ;;
    2)
        # fnm 安装逻辑
        if command -v fnm &> /dev/null; then
            color_echo GREEN "[fe] fnm is already installed"
        else
            color_echo GREEN "[fe] fnm could not be found"
            color_echo YELLOW "[fe] Installing fnm..."
            curl -fsSL https://fnm.vercel.app/install | bash
            color_echo YELLOW "[fe] re-run this script to finish the installation"
            exec zsh
            exit 0
        fi
        ;;
    *)
        color_echo RED "[fe] Invalid choice. Exiting..."
        exit 1
        ;;
esac

# 安装 pnpm
color_echo YELLOW "[fe] Installing pnpm@7..."
eval "$NODE_INSTALL_CMD"
$INSTALL_CMD pnpm@7

# 安装通用工具链
if [[ $* == *--no-tools* ]]; then
    color_echo GREEN "[fe] Skipping tools chain installation"
else
    color_echo YELLOW "[fe] Installing tools chain..."
    $INSTALL_CMD eslint prettier stylelint typescript@4.8 ts-node husky
fi

# git commitizen
color_echo YELLOW "[fe] Checking git commitizen..."
if ! command -v git-cz &> /dev/null; then
    color_echo YELLOW "[fe] Installing git commitizen..."
    $INSTALL_CMD git-cz commitizen
else
    color_echo GREEN "[fe] git-cz is already installed"
fi

# init commitizen with git-cz
if [ ! -f ~/.git-cz.json ]; then
    color_echo YELLOW "[fe] Initializing git commitizen config..."
    commitizen init git-cz
    echo '{
      "disableEmoji": true
    }' > ~/.git-cz.json
else
    color_echo GREEN "[fe] git-cz config already exists"
fi

color_echo GREEN "[fe] Done!"
