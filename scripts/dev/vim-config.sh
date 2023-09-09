#!/bin/bash
source $(pwd)/scripts/utils/log.sh

prefix="vim"

# Check if .vimrc file exists, if not, create it
if [ ! -f ~/.vimrc ]; then
    touch ~/.vimrc
    prefix_log "Created .vimrc configuration file." $prefix
else
    prefix_log ".vimrc configuration file already exists." $prefix
fi

# Define vim configuration as a variable
vim_config='
" common settings
syntax enable
set relativenumber
set expandtab
set tabstop=2
set shiftwidth=2
set cursorline
hi CursorLine cterm=NONE ctermbg=235 guibg=Grey10

" shortcuts
imap jk <Esc>
"" navigation
nmap <C-j> 3j
nmap <C-k> 3k
nmap <C-e> 3e
nmap <C-b> 3b
'

# Add vim configuration to .vimrc
echo "$vim_config" > ~/.vimrc
prefix_log "Updated .vimrc configuration." $prefix

