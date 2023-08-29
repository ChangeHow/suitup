#!/bin/bash

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

echo "[cli] finished!"


echo "Done."
