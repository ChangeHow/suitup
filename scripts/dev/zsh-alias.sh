#!/bin/zsh
source $(pwd)/scripts/utils/log.sh
source $(pwd)/scripts/init/init-configs.sh

prefix="zsh alias"
aliases_file=$HOME/.config/suitup/aliases
# this script will add some alias to .config/zsh/aliases

prefix_log "add aliases to .config/zsh/alias" $prefix

append_to "alias reload-zsh=\"exec zsh\"" $aliases_file
append_to "alias edit-zsh=\"vi $HOME/.zshrc\"" $aliases_file

prefix_log "display colorful file tree with ll command" $prefix
append_to "alias ll=\"exa -abghlS\"" $aliases_file

prefix_log "using bat instead of cat" $prefix
append_to_zshrc "export BAT_THEME=\"TwoDark\""
append_to "alias cat=\"bat\"" $aliases_file

prefix_log "you can use \"gph\" to push branch" $prefix
append_to "alias gph=\"git push\"" $aliases_file

prefix_log "you can use \"gpl\" to pull branch" $prefix
append_to "alias gpl=\"git pull --rebase\"" $aliases_file

prefix_log "you can use \"gcz\" to commit with commitizen" $prefix
append_to "alias gcz=\"git cz\"" $aliases_file
color_echo YELLOW "Using 'gcz' to call a interactive interface to submit you commits"

prefix_log "you can use \"gst\" to print git status" $prefix
append_to "alias gst=\"git status\"" $aliases_file

prefix_log "you can use \"glg\" to output formatted git logs" $prefix
append_to "alias glg=\"git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit\"" $aliases_file

prefix_log "you can use \"ss\" to search file with preview" $prefix
append_to "alias ss=\"fzf --preview 'bat --style=numbers {}'\"" $aliases_file
color_echo YELLOW "You can use 'ss' to search file in current dir"

prefix_log "completed" $prefix
