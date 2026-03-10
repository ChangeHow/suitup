# ============================================================================
# External tool configuration and initialization
# ============================================================================

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

_zsh_tools_cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/zsh"
[[ -d "$_zsh_tools_cache_dir" ]] || mkdir -p "$_zsh_tools_cache_dir"

_source_cached_tool_init() {
  local cache_name="$1"
  local binary_name="$2"
  local init_command="$3"
  local binary_path
  local cache_file="$_zsh_tools_cache_dir/${cache_name}.zsh"
  local tmp_file="${cache_file}.tmp"

  binary_path=$(command -v "$binary_name") || return 0

  if [[ ! -s "$cache_file" || "$binary_path" -nt "$cache_file" ]]; then
    if eval "$init_command" >| "$tmp_file" 2>/dev/null; then
      mv "$tmp_file" "$cache_file"
    else
      rm -f "$tmp_file"
      eval "$init_command"
      return
    fi
  fi

  source "$cache_file"
}

_source_cached_tool_init atuin-init atuin 'atuin init zsh'
_source_cached_tool_init fzf-init fzf 'fzf --zsh'
_source_cached_tool_init zoxide-init zoxide 'zoxide init zsh'
_source_cached_tool_init fnm-init fnm 'fnm env --use-on-cd --version-file-strategy=recursive --shell zsh'
