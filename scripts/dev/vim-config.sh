#!/bin/bash
source $(pwd)/scripts/utils/log.sh

prefix="vim"
custom_vim_cfg=$HOME/.config/suitup/config.vim

# Check if .vimrc file exists, if not, create it
if [ ! -f $HOME/.vimrc ]; then
    touch $HOME/.vimrc
    prefix_log "Created .vimrc configuration file." $prefix
else
    prefix_log ".vimrc configuration file already exists." $prefix
fi

if [ ! -f $custom_vim_cfg ]; then
    touch $custom_vim_cfg
    prefix_log "Created $custom_vim_cfg" $prefix
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
echo "$vim_config" >$custom_vim_cfg

if ! grep -q "source $custom_vim_cfg" "$HOME/.vimrc"; then
    prefix_log "load custom vim config" $prefix
    # 并在 zshrc 文件中引用它
    echo "source $custom_vim_cfg" >>"$HOME/.vimrc"
fi

prefix_log "Updated .vimrc configuration." $prefix
