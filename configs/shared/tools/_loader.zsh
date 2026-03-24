# ============================================================================
# Shared tool loader and cached init helpers
# ============================================================================
#
# This file contains common helpers used by multiple tool modules.
#
# Maintenance rules:
# - Put reusable helper functions here only when at least two tool modules need
#   them, or when the helper exists purely to support module loading.
# - Keep tool-specific env vars, aliases, bindings, and wrapper functions in the
#   tool's own file.
# - `_source_cached_tool_init` is the preferred way to source expensive shell
#   init output from CLIs such as `fzf`, `zoxide`, `fnm`, and `atuin`.

_zsh_tools_cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/zsh"
[[ -d "$_zsh_tools_cache_dir" ]] || mkdir -p "$_zsh_tools_cache_dir"

_load_tool_config() {
  local tool_name="$1"
  local tool_file="$_zsh_tools_dir/${tool_name}.zsh"

  [[ -f "$tool_file" ]] && source "$tool_file"
}

_source_cached_tool_init() {
  local cache_name="$1"
  local binary_name="$2"
  local init_command="$3"
  local binary_path
  local cache_file="$_zsh_tools_cache_dir/${cache_name}.zsh"
  local tmp_file="${cache_file}.tmp"
  local version_file="$_zsh_tools_cache_dir/${cache_name}.version"
  local current_version

  binary_path=$(command -v "$binary_name") || return 0
  current_version=$("$binary_path" --version 2>/dev/null | head -1) || current_version="unknown"

  if [[ -s "$cache_file" && -s "$version_file" ]]; then
    local cached_version
    cached_version=$(<"$version_file")
    if [[ "$current_version" == "$cached_version" ]]; then
      source "$cache_file"
      return
    fi
  fi

  if eval "$init_command" >| "$tmp_file" 2>/dev/null; then
    mv "$tmp_file" "$cache_file"
    echo -n "$current_version" > "$version_file"
  else
    rm -f "$tmp_file"
    eval "$init_command"
    return
  fi

  source "$cache_file"
}
