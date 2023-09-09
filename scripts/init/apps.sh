#!/bin/bash
source $(pwd)/scripts/utils/log.sh

prefix="apps"

function install_if_not_present() {
  local app_name=$1
  local brew_name=$2

  if [ -z "$(brew ls --versions $brew_name)" ]; then
    prefix_log "Installing $app_name..." $prefix
    brew install --cask $brew_name
  else
    prefix_log "$app_name is already installed. Skipping." $prefix
  fi
}

if which brew >/dev/null; then
  prefix_log "Homebrew is installed." $prefix
else
  prefix_log "Homebrew is not installed." $prefix
fi

install_if_not_present "iTerm2" "iterm2"
install_if_not_present "Raycast" "raycast"
install_if_not_present "Google Chrome" "google-chrome"
install_if_not_present "Visual Studio Code" "visual-studio-code"
install_if_not_present "Orbstack" "orbstack"
install_if_not_present "Itsycal" "itsycal"
