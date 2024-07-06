#!/bin/bash

set -e

# 定义一些颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

color_echo() {
  COLOR=$1
  shift
  echo -e "${!COLOR}$@${NC}"
}

prefix_log() {
  local prefix=${2:-log}
  color_echo BLUE "[$prefix] $1"
}

# Check if Homebrew is installed
if ! command -v brew &> /dev/null
then
    color_echo BLUE "Homebrew is not installed, installing now..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    (echo; echo 'eval "$(/opt/homebrew/bin/brew shellenv)"') >> /Users/changehow/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    color_echo GREEN "Homebrew is already installed"
fi

# Install Zsh if not installed
if ! command -v zsh &> /dev/null
then
    color_echo BLUE "Zsh is not installed, installing now..."
    brew install zsh
else
    color_echo GREEN "Zsh is already installed"
fi

# Install Oh My Zsh if not installed
if [ ! -d "$HOME/.oh-my-zsh" ]
then
    color_echo BLUE "Oh My Zsh is not installed, installing now..."
    /bin/sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
else
    color_echo GREEN "Oh My Zsh is already installed"
fi

# Set Zsh as default shell if not already set
if [ "$SHELL" != "$(which zsh)" ]
then
    color_echo BLUE "Setting Zsh as the default shell"
    chsh -s "$(which zsh)"
else
    color_echo GREEN "Zsh is already set as the default shell"
fi

color_echo YELLOW "You can use 'exec zsh' to reload zsh"

# Restart shell
exec zsh
