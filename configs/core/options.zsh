# ============================================================================
# Zsh shell options and history settings
# ============================================================================

# Auto cd
setopt AUTO_CD

# History settings
export HISTFILE=~/.zsh_history
export HISTSIZE=50000
export SAVEHIST=50000
export HIST_STAMPS="yyyy-mm-dd"

# History options
setopt EXTENDED_HISTORY
setopt INC_APPEND_HISTORY
setopt HIST_IGNORE_ALL_DUPS
setopt HIST_FIND_NO_DUPS
setopt HIST_SAVE_NO_DUPS
setopt HIST_REDUCE_BLANKS

# Completion options
setopt COMPLETE_IN_WORD
setopt ALWAYS_TO_END
if [[ "$OSTYPE" == linux* ]]; then
  unsetopt CORRECT
else
  setopt CORRECT
fi
setopt GLOB_COMPLETE
setopt NO_CASE_GLOB
