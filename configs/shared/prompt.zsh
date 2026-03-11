# ============================================================================
# Prompt / theme loading — must run last
# ============================================================================

# For zinit-based setups: load p10k as the final plugin so it wraps everything
(( ${+functions[zinit]} )) && { zinit ice depth"1"; zinit light romkatv/powerlevel10k; }

# Apply p10k configuration
[[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh
