# ============================================================================
# atuin history integration
# ============================================================================
#
# This module owns shell initialization for atuin.
#
# Maintenance rules:
# - Load atuin after fzf so atuin can override Ctrl-R with its history widget.
# - Do not place completion or Tab behavior here; keep atuin focused on history.
# - If atuin init ever conflicts with another history tool, document the final
#   binding winner in `shared/tools.zsh`.

# Atuin - load after fzf to override ctrl-r binding.
_source_cached_tool_init atuin-init atuin 'atuin init zsh'
