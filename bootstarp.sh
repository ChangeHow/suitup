#!/bin/bash

set -e

# Check if Homebrew is installed
if ! command -v brew &> /dev/null
then
    echo "Homebrew is not installed, installing now..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    (echo; echo 'eval "$(/opt/homebrew/bin/brew shellenv)"') >> /Users/changehow/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "Homebrew is already installed"
fi

# Install Zsh if not installed
if ! command -v zsh &> /dev/null
then
    echo "Zsh is not installed, installing now..."
    brew install zsh
else
    echo "Zsh is already installed"
fi

# Install Oh My Zsh if not installed
if [ ! -d "$HOME/.oh-my-zsh" ]
then
    echo "Oh My Zsh is not installed, installing now..."
    /bin/sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
else
    echo "Oh My Zsh is already installed"
fi

# Set Zsh as default shell if not already set
if [ "$SHELL" != "$(which zsh)" ]
then
    echo "Setting Zsh as the default shell"
    chsh -s "$(which zsh)"
else
    echo "Zsh is already set as the default shell"
fi

# Restart shell
exec zsh
