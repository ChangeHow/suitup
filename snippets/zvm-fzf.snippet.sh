function zvm_post_init() {
  export FZF_DEFAULT_COMMAND='rg --files --no-ignore --hidden --follow --glob "!{**/node_modules/*,.git/*,*/tmp/*}"'
  eval "$(atuin init zsh)"
  eval "$(fzf --zsh)"
}
zvm_after_init_commands+=(zvm_post_init)
