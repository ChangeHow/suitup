# FZF
# Note: home-directory branch returns nothing (no empty line) to avoid
#       cluttering the picker when running fzf from $HOME.
export FZF_DEFAULT_COMMAND='
  if [[ "$PWD" != "$HOME" ]]; then
    fd --type d --hidden --follow \
      --base-directory . \
      --exclude node_modules --exclude .git --exclude dist --exclude output --exclude tmp \
      2>/dev/null;
    fd --type f --hidden --follow \
      --base-directory . \
      --exclude node_modules --exclude .git --exclude dist --exclude output --exclude tmp \
      2>/dev/null
  fi
'

export FZF_CTRL_T_COMMAND=$FZF_DEFAULT_COMMAND

export FZF_CTRL_T_OPTS="
  --height 100%
  --header '[C-/] toggle preview | [Alt-j/k] scroll preview'
  --preview 'if [ -f {} ]; then
    bat --color=always --style=plain --line-range :300 {};
  elif [ -d {} ]; then
    eza -L 2 -T --git-ignore {} 2>/dev/null | head -20;
  fi'
  --preview-window=right:50%:wrap
  --bind 'ctrl-/:toggle-preview'
  --bind 'alt-j:preview-down'
  --bind 'alt-k:preview-up'
  --bind 'ctrl-d:preview-page-down'
  --bind 'ctrl-u:preview-page-up'
"
