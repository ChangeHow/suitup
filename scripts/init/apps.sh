#!/bin/bash
source $(pwd)/scripts/utils/log.sh

prefix="apps"

function install_if_not_present() {
  local app_name=$1
  local brew_name=$2
  local brew_type=$3

  # check if app is already installed
  if ! brew list $brew_name &>/dev/null; then
    prefix_log "Installing $app_name..." $prefix
    # if brew type is not provided, default to install formula
    if [ -z "$brew_type" ]; then
      brew install $brew_name
    elif [ "$brew_type" == "cask" ]; then
      brew install --cask $brew_name
    fi
  else
    prefix_log "$app_name is already installed. Skipping." $prefix
  fi
}

if which brew >/dev/null; then
  prefix_log "Homebrew is installed." $prefix
else
  prefix_log "Homebrew is not installed." $prefix
fi

install_if_not_present "iTerm2" "iterm2" "cask"
install_if_not_present "Raycast" "raycast" "cask"
# install_if_not_present "Google Chrome" "google-chrome" "cask"
install_if_not_present "Visual Studio Code" "visual-studio-code" "cask"
# install_if_not_present "Orbstack" "orbstack" "cask"
install_if_not_present "Itsycal" "itsycal" "cask"
install_if_not_present "Postman" "postman" "cask"
install_if_not_present "Pap.er: a wallpaper app" "paper" "cask"
# font
install_if_not_present "Font: Monaspace" "font-monaspace" "cask"
install_if_not_present "Font: Space Mono" "font-space-mono" "cask"
