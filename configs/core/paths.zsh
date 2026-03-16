# ============================================================================
# PATH configuration placeholder
# ============================================================================

# Homebrew can live outside the default PATH on fresh macOS/Linux installs.
# Load its shellenv early so later tool detection works after suitup rewrites ~/.zshrc.
for _suitup_brew_bin in \
  "${HOMEBREW_PREFIX:+$HOMEBREW_PREFIX/bin/brew}" \
  /opt/homebrew/bin/brew \
  /home/linuxbrew/.linuxbrew/bin/brew \
  /usr/local/bin/brew
do
  [[ -n "$_suitup_brew_bin" && -x "$_suitup_brew_bin" ]] || continue
  eval "$("$_suitup_brew_bin" shellenv zsh)"
  break
done
unset _suitup_brew_bin

# Keep this file for user PATH overrides if needed.
