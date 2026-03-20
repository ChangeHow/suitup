export function isZshShell(shell = process.env.SHELL || "") {
  return /(^|\/)zsh$/.test(shell);
}

export function requireZshShell(commandLabel = "This suitup command") {
  if (isZshShell()) {
    return true;
  }

  console.error(
    `${commandLabel} must be run from zsh.\n` +
      'Switch to zsh first: run `zsh` for this session or `chsh -s "$(which zsh)"` to make it your default shell.'
  );
  return false;
}
