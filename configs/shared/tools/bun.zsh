# ============================================================================
# bun completion
# ============================================================================
#
# This module keeps bun completion isolated because it is optional and can be
# loaded slightly later without hurting the main interactive shell experience.
#
# Maintenance rules:
# - Keep this async unless there is a strong reason to make bun completion part
#   of the synchronous startup path.
# - Only source the completion file when it exists on the current machine.

{
  sleep 0.5
  [[ -s "$HOME/.bun/_bun" ]] && source "$HOME/.bun/_bun"
} &!
