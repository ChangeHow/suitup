#!/bin/zsh

# 检查 brew 是否安装
echo "[cli] checking homebrew installation status"
if ! command -v brew &> /dev/null
then
    echo "brew could not be found. Please install Homebrew."
    exit
fi

echo "[cli] checking git installation status"
# 检查 git 是否安装
if ! command -v git &> /dev/null
then
    echo "git could not be found. Please install git."
    exit
fi

echo "[cli] autojump..."
if brew list autojump &> /dev/null
then
    echo "[cli] autojump is already installed."
else
    brew install autojump
    echo "[ -f /opt/homebrew/etc/profile.d/autojump.sh ] && . /opt/homebrew/etc/profile.d/autojump.sh" >> ~/.zshrc
fi

echo "[cli] bat..."
# 使用 brew 安装 bat
if brew list bat &> /dev/null
then
    echo "[cli] bat is already installed."
else
    brew install bat
fi

echo "[cli] htop..."
if brew list htop &> /dev/null
then
    echo "[cli] htop is already installed."
else
    brew install htop
fi

echo "[cli] neofetch..."
if brew list neofetch &> /dev/null
then
    echo "[cli] neofetch is already installed."
else
    brew install neofetch
fi

echo "[cli] postman..."
if brew list postman &> /dev/null
then
    echo "[cli] postman is already installed."
else
    brew install --cask postman
fi

echo "[cli] exa..., a replacement of ls"
if brew list exa &> /dev/null
then
    echo "[cli] exa is already installed."
else
    brew install exa
    echo "[cli] replace ls with exa"
    echo "alias ls=\"exa -abghHliS\" # exa config" >> ~/.zshrc
fi

echo "[cli] install atuin..."
if brew list atuin &> /dev/null
then
    echo "[cli] atuin is already installed."
else
    bash <(curl https://setup.atuin.sh)
fi

echo "[cli] install volta..."
curl https://get.volta.sh | bash

echo "[cli] finished installation!"

echo "[cli] reload zsh"
exec zsh

echo "Done."
