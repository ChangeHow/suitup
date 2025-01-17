#!/bin/bash
source $(pwd)/scripts/utils/log.sh
source $(pwd)/scripts/init/init-configs.sh

prefix="zsh alias"
aliases_file=$HOME/.config/suitup/aliases
plugins_file=$HOME/.config/suitup/plugins
# this script will add some alias to .config/zsh/aliases

prefix_log "add aliases to .config/zsh/alias" $prefix

append_to "alias reload-zsh=\"exec zsh\"" $aliases_file

# edit zsh
prefix_log "you can use \"edit-zsh\" to edit zshrc file" $prefix
append_to "alias edit-zsh=\"vi $HOME/.zshrc\"" $aliases_file
color_echo YELLOW "You can use 'edit-zsh' to edit zshrc file"

# edit aliases
prefix_log "you can use \"edit-aliases\" to edit aliases file" $prefix
append_to "alias edit-aliases=\"vi $aliases_file\"" $aliases_file
color_echo YELLOW "You can use 'edit-aliases' to edit aliases file"

# edit plugins
prefix_log "you can use \"edit-plugins\" to edit plugins file" $prefix
append_to "alias edit-plugins=\"vi $plugins_file\"" $aliases_file
color_echo YELLOW "You can use 'edit-plugins' to edit plugins file"

prefix_log "display colorful file tree with ll command" $prefix
append_to "alias ll=\"eza -abghlS\"" $aliases_file
append_to "alias ltree=\"eza -T\"" $aliases_file

prefix_log "using bat instead of cat" $prefix
append_to_zshrc "export BAT_THEME=\"TwoDark\""
append_to "alias cat=\"bat\"" $aliases_file

prefix_log "you can use \"gph\" to push branch" $prefix
append_to "alias gph=\"git push\"" $aliases_file

prefix_log "you can use \"gpl\" to pull branch" $prefix
append_to "alias gpl=\"git pull --rebase\"" $aliases_file

prefix_log "you can use \"gcz\" to commit with commitizen" $prefix
append_to "alias gcz=\"git-cz\"" $aliases_file
color_echo YELLOW "Using 'gcz' to call a interactive interface to submit you commits"

prefix_log "you can use \"gst\" to print git status" $prefix
append_to "alias gst=\"git status\"" $aliases_file

prefix_log "you can use \"glg\" to output formatted git logs" $prefix
append_to "alias glg=\"git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit\"" $aliases_file

prefix_log "completed" $prefix
