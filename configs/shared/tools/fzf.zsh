# ============================================================================
# fzf configuration and Ctrl-T widget
# ============================================================================
#
# This module owns all fzf-specific shell behavior in this config.
#
# Maintenance rules:
# - Keep `Tab` completion out of this file. `Tab` belongs to
#   `shared/completion.zsh` and should remain native zsh completion.
# - `Ctrl-T` belongs here and should stay focused on interactive path picking.
# - Update preview behavior here if file/dir preview tools change.
# - If the partial-path completion logic changes, prefer small behavior changes
#   and test `~/path`, `./path`, and relative nested paths before committing.

# Note: home-directory branch returns nothing (no empty line) to avoid
# cluttering the picker when running fzf from $HOME.
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
  --preview 'target={};
  if [[ \"$target\" != /* ]]; then
    target=\"${FZF_CTRL_T_PREVIEW_ROOT:-$PWD}/$target\";
  fi;
  if [ -f \"$target\" ]; then
    bat --color=always --style=plain --line-range :300 \"$target\";
  elif [ -d \"$target\" ]; then
    eza -L 2 -T --git-ignore \"$target\" 2>/dev/null | head -20;
  fi'
  --preview-window=right:50%:wrap
  --bind 'ctrl-/:toggle-preview'
  --bind 'alt-j:preview-down'
  --bind 'alt-k:preview-up'
  --bind 'ctrl-d:preview-page-down'
  --bind 'ctrl-u:preview-page-up'
"

_source_cached_tool_init fzf-init fzf 'fzf --zsh'

_fzf_ctrl_t_command='if [[ -d "$FZF_CTRL_T_BASE" ]]; then
  fd --type d --hidden --follow \
    --base-directory "$FZF_CTRL_T_BASE" \
    --exclude node_modules --exclude .git --exclude dist --exclude output --exclude tmp \
    2>/dev/null;
  fd --type f --hidden --follow \
    --base-directory "$FZF_CTRL_T_BASE" \
    --exclude node_modules --exclude .git --exclude dist --exclude output --exclude tmp \
    2>/dev/null;
fi'

_fzf_ctrl_t_path_context() {
  local token="$1"
  local expanded_token="$token"
  local raw_dir expanded_dir

  if [[ "$token" != */* && "$token" != "~"* && "$token" != .* ]]; then
    return 1
  fi

  case "$expanded_token" in
    '~')
      expanded_token="$HOME"
      ;;
    '~/'*)
      expanded_token="$HOME/${expanded_token#~/}"
      ;;
  esac

  if [[ -d "$expanded_token" ]]; then
    REPLY="$expanded_token"
    REPLY2="${token%/}/"
    REPLY3=""
    return 0
  fi

  raw_dir="${token:h}"
  expanded_dir="${expanded_token:h}"
  if [[ "$expanded_dir" == "$expanded_token" || ! -d "$expanded_dir" ]]; then
    return 1
  fi

  REPLY="$expanded_dir"
  if [[ "$raw_dir" == '.' ]]; then
    REPLY2=""
  else
    REPLY2="${raw_dir%/}/"
  fi
  REPLY3="${token:t}"
}

_fzf_ctrl_t_select_from() {
  setopt localoptions pipefail no_aliases 2>/dev/null
  local base_dir="$1"
  local insert_prefix="$2"
  local query="$3"
  local item

  FZF_CTRL_T_BASE="$base_dir" \
  FZF_CTRL_T_PREVIEW_ROOT="$base_dir" \
  FZF_DEFAULT_COMMAND="$_fzf_ctrl_t_command" \
  FZF_DEFAULT_OPTS=$(__fzf_defaults "--reverse --scheme=path" "${FZF_CTRL_T_OPTS-} -m --query=${(qqq)query}") \
  FZF_DEFAULT_OPTS_FILE='' $(__fzfcmd) < /dev/tty | while read -r item; do
    echo -n -E "${(q)insert_prefix$item} "
  done
  local ret=$?
  echo
  return $ret
}

fzf-file-widget() {
  setopt localoptions noshwordsplit noksh_arrays noposixbuiltins pipefail no_aliases 2>/dev/null
  local -a tokens
  local token base_dir insert_prefix query lbuf selected ret

  if [[ ${LBUFFER[-1]} == ' ' ]]; then
    LBUFFER="${LBUFFER}$(__fzf_select)"
    ret=$?
    zle reset-prompt
    return $ret
  fi

  tokens=(${(z)LBUFFER})
  token="${tokens[-1]-}"
  if [[ -z "$token" ]] || ! _fzf_ctrl_t_path_context "$token"; then
    LBUFFER="${LBUFFER}$(__fzf_select)"
    ret=$?
    zle reset-prompt
    return $ret
  fi

  base_dir="$REPLY"
  insert_prefix="$REPLY2"
  query="$REPLY3"
  lbuf="${LBUFFER:0:-${#token}}"
  selected="$(_fzf_ctrl_t_select_from "$base_dir" "$insert_prefix" "$query")"
  ret=$?

  if [[ -n "$selected" ]]; then
    LBUFFER="$lbuf$selected"
  fi

  zle reset-prompt
  return $ret
}

zle     -N            fzf-file-widget
bindkey -M emacs '^T' fzf-file-widget
bindkey -M vicmd '^T' fzf-file-widget
bindkey -M viins '^T' fzf-file-widget
