#!/bin/zsh
source $(pwd)/scripts/utils/log.sh
source $(pwd)/scripts/init/init-configs.sh

prefix="zsh alias"
aliases_file=$HOME/.config/zsh/aliases
# this script will add some alias to .config/zsh/aliases

prefix_log "add aliases to .config/zsh/alias" $prefix

echo "alias reload-zsh=\"exec zsh\"" >> $aliases_file
echo "alias edit-zsh=\"vi $HOME/.zshrc\"" >> $aliases_file

prefix_log "display colorful file tree with ll command" $prefix
echo "alias ll=\"exa -abghlS\"" >> $aliases_file

prefix_log "using bat instead of cat" $prefix
echo "export BAT_THEME=\"TwoDark\"" >> $HOME/.zshrc
echo "alias cat=\"bat\"" >> $aliases_file

prefix_log "you can use \"gph\" to push branch" $prefix
echo "alias gph=\"git push\"" >> $aliases_file

prefix_log "you can use \"gpl\" to pull branch" $prefix
echo "alias gpl=\"git pull --rebase\"" >> $aliases_file

prefix_log "you can use \"gcz\" to commit with commitizen" $prefix
echo "alias gcz=\"git cz\"" >> $aliases_file

prefix_log "you can use \"ss\" to search file with preview" $prefix
echo "alias ss=\"fzf --preview 'bat --style=numbers {}'\"" >> $aliases_file

prefix_log "completed" $prefix