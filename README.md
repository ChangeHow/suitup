# Suit up!

<p align="center">
    <img src="https://github.com/ChangeHow/suitup/blob/main/suitup.mini.png?raw=true"
        height="120">
</p>

## About name

This name is inspired by Barney's catchphrase, Barney is a character in my favorite TV series: [How I met your mother](https://www.themoviedb.org/tv/1100-how-i-met-your-mother).

## About this repository

This preset will hold every thing in `~/.config/suitup` folder.

## Getting started

1. run bootstrap in a very first step.

   ```shell
   curl -sL https://raw.githubusercontent.com/changehow/suitup/master/bootstrap.sh | bash
   ```

2. after initial step, you need run `./scripts/init/init-config.sh` to init configuration folder.
3. run `./scripts/init/install-zsh-plugins.sh` to install zsh plugins.
4. run `./scripts/init/apps.sh` to install apps.
5. run `./scripts/init/command-line-tools.sh` to install command line tools.
6. run `./scripts/init/front-end.sh` to install front-end tools.

## Apps & Fonts

1. [Homebrew](https://brew.sh/)
2. [Oh My Zsh](https://ohmyz.sh/)
3. [iTerm2](https://iterm2.com/)
4. [Visual Studio Code](https://code.visualstudio.com/)
5. [Itsycal](https://www.mowglii.com/itsycal/) A cute calendar for macOS, I really like it.
6. [Raycast](https://raycast.com/) A powerful tool for macOS, I use it to replace [Alfred](https://www.alfredapp.com/).
7. [Monaspace](https://monaspace.githubnext.com)

## Zsh plugins

1. [zplug](https://github.com/zplug/zplug)
2. [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)
3. [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)

## CLI tools
1. [autojump](https://github.com/wting/autojump)
2. [fzf](https://github.com/junegunn/fzf) and [atuin](https://github.com/atuinsh/atuin)
3. [bat](https://github.com/sharkdp/bat) a cat clone with wings.
4. [eza](https://github.com/eza-community/eza) a modern replacement for `ls`.

## Vim & Aliases
We also provide vim configuration and some aliases:
1. using `jk` to replace `ESC` in vim.
2. using `<C-j/k/e/b>` to quick navigating in vim.
3. add some base settings to vim.
4. add some aliases like `gph:git push`, `gpl:git pull --rebase`, `gco:git checkout`...

# How to reset/reinstall

Run this command and reset to default zsh config(`.zshrc`)

```shell
sh ./clean.sh
```

This script will do:

1. remove `~/.config/suitup`
2. remove `~/.oh-my-zsh`
3. remove `~/.zshrc`
4. switch to `bash`, _or you can keep `zsh` if you macOS has changed the default shell to zsh_.

# In the end

After doing this, you can enjoy your development journey. 🎉
