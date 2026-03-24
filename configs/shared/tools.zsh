# ============================================================================
# Shared tool entry point
# ============================================================================
#
# This file is the only tool entry point sourced by `~/.zshrc`.
#
# Maintenance rules:
# - Keep this file orchestration-only. Do not add tool-specific logic here.
# - Add shared helper functions to `shared/tools/_loader.zsh`.
# - Add each tool to its own file under `shared/tools/`.
# - Keep the load order explicit. Do not auto-discover files from the directory,
#   because keyboard bindings and tool init order matter.
# - If two tools compete for the same binding, document the winner here.

_zsh_tools_dir="${ZSH_CONFIG:-$HOME/.config/zsh}/shared/tools"

source "$_zsh_tools_dir/_loader.zsh"

# Load order matters:
# 1. fzf defines Ctrl-T and shared picker behavior.
# 2. runtime tools initialize common navigation/node helpers.
# 3. atuin loads after fzf so it can own Ctrl-R.
# 4. bun completion is deferred because it is non-essential at startup.
_load_tool_config fzf
_load_tool_config runtime
_load_tool_config atuin
_load_tool_config bun
