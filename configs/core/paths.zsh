# ============================================================================
# PATH configuration
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

# fnm (Fast Node Manager) — keep the fnm binary itself on PATH after suitup
# rewrites ~/.zshrc, then expose the default Node installation to all shells
# so globally-installed CLIs (pnpm, git-cz …) work in non-interactive
# contexts such as scripts, editors, agents, and git hooks. Interactive
# shells get the full fnm env from shared/tools.zsh instead.
_suitup_fnm_dir="${FNM_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/fnm}"
if [[ -d "$_suitup_fnm_dir" && ":${PATH}:" != *":${_suitup_fnm_dir}:"* ]]; then
  export PATH="${_suitup_fnm_dir}:${PATH}"
fi

_suitup_fnm_default_bin="${_suitup_fnm_dir}/aliases/default/bin"
if [[ -d "$_suitup_fnm_default_bin" && ":${PATH}:" != *":${_suitup_fnm_default_bin}:"* ]]; then
  export PATH="${_suitup_fnm_default_bin}:${PATH}"
fi
unset _suitup_fnm_dir _suitup_fnm_default_bin

# Keep this file for user PATH overrides if needed.
