#!/bin/bash
source $(pwd)/scripts/utils/log.sh

prefix_log "removing default dock items..." "dock"
defaults write com.apple.dock persistent-apps -array
# enable magic effect & set magnification to large
defaults write com.apple.dock mineffect -string "genie"
defaults write com.apple.dock largesize -int 90
killall Dock