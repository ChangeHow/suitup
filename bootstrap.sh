#!/bin/bash
source $(pwd)/scripts/utils/log.sh

set -e

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
