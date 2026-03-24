# ============================================================================
# Runtime helper tools
# ============================================================================
#
# This module groups lightweight shell integrations that do not own complex
# interactive behavior in this config.
#
# Maintenance rules:
# - Keep navigation/runtime init here when the tool only needs shell init.
# - If a tool starts to need custom widgets, preview logic, or wrappers, move it
#   into its own file instead of growing this module.

_source_cached_tool_init zoxide-init zoxide 'zoxide init zsh'
_source_cached_tool_init fnm-init fnm 'fnm env --use-on-cd --version-file-strategy=recursive --shell zsh'
