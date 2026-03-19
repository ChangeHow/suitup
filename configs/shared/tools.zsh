# ============================================================================
# External tool configuration and initialization
# ============================================================================

# FZF configuration (env vars for fd-based search and preview bindings)
[[ -f "${ZDOTDIR:-$HOME/.config/zsh}/shared/fzf.zsh" ]] && source "${ZDOTDIR:-$HOME/.config/zsh}/shared/fzf.zsh"

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

_source_cached_tool_init fzf-init fzf 'fzf --zsh'
_source_cached_tool_init atuin-init atuin 'atuin init zsh'
_source_cached_tool_init zoxide-init zoxide 'zoxide init zsh'
_source_cached_tool_init fnm-init fnm 'fnm env --use-on-cd --version-file-strategy=recursive --shell zsh'
