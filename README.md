# Suit up!

<p align="center">
    <img src="https://github.com/ChangeHow/suitup/blob/main/suitup.mini.png?raw=true"
        height="120">
</p>

## About name

This name is inspired by Barney's catchphrase, Barney is a character in my favorite TV series: [How I met your mother](https://www.themoviedb.org/tv/1100-how-i-met-your-mother).

## About this repositery

This repositery contains my personal development configurations like zsh, shell scripts... 🙌 very welcome to try it out~

## Easy to get started

_I don't know how to use single one script to install everything_, so I seperate them into different scripts.

Please follow the steps below to init your development environment:

1. Clone this repositery to your local machine.
2. Before running the scripts and if you living in China mainland, please ensure you can visit [google](https://www.google.com) and [github](https://github.com) at least.
3. Run `sh ./bootstrap.sh` to install homebrew, zsh and oh-my-zsh.
4. Run `sh ./scripts/init/command-line-tools.sh` to install command line tools that I suggest. They are:
   - autojump, a tool to jump to your favorite directory.
   - bat, a cat clone with syntax highlight.
   - htop, to monitor your system.
   - neofetch, to insignt your system information.
   - postman, sorry, it's not a command line tool, but I still install it in this step. :sad
   - exa, a ls clone with syntax highlight.
   - atuin, a tool to power your shell history.
5. Run `sh ./scripts/init/install-zsh-plugins.sh` to init zplug and add plugins to it. There are the plugins:
   - zsh-autosuggestions, to suggest commands when you type.
   - zsh-syntax-highlighting, to highlight commands when you type.
6. Okay, as a frontend developer, I create a script to init the development environment. They are:
   - volta, a tool to manage node versions.
   - node and pnpm, installed them by volta.
   - some tools like eslint, prettier, stylelint...
   - commitzen, a tool to help you write commit message.
7. Actually, those tools seems enough to start developping. But I still have some customize configrations, you can keep following the steps if you want.

## Customize configrations

### Apps

```shell
sh ./scripts/init/apps.sh
```

Running this script to install useful apps like:

- google chrome
- visual studio code
- iterm2
- raycast, alternative to alfred, a powerful tool to help you improve your productivity.
- orbstack, a tool to manage your docker containers.
- itsycal, a tool to show your calendar.

### My dotfile

You can init `.vimrc` by running:

```shell
sh ./scripts/dev/vim-config.sh
```

And add some useful zsh aliases by running:

```shell
sh ./scripts/dev/zsh-alias.sh
```

# In the end

After doing this, you can enjoy your development journey. 🎉
