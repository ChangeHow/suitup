#!/bin/zsh

# 检查 .zshrc 文件是否存在
if [ -f "$HOME/.zshrc" ]; then
    echo ".zshrc file exists."
else
    echo ".zshrc file does not exist."
    exit 1
fi

# 创建插件目录，如果它不存在
mkdir -p ~/.config/zsh

# 通过 brew 安装 zplug
if brew list zplug >/dev/null 2>&1; then
    echo "zplug is already installed."
else
    echo "Installing zplug..."
    brew install zplug
fi

# 将 zplug 配置添加到插件文件
echo "source $(brew --prefix)/opt/zplug/init.zsh" > ~/.config/zsh/plugins

# 使用 zplug 安装插件
echo "Installing plugins with zplug..."
echo "zplug 'zsh-users/zsh-autosuggestions'" >> ~/.config/zsh/plugins
echo "zplug 'wting/autojump'" >> ~/.config/zsh/plugins
echo "zplug 'zsh-users/zsh-syntax-highlighting'" >> ~/.config/zsh/plugins

# 将插件文件 source 到 .zshrc
echo "echo \"[zplug] Load zplug config\"" >> ~/.zshrc
echo "source ~/.config/zsh/plugins" >> ~/.zshrc

# 在 .zshrc 中添加提示
echo "echo \"[zplug] Updating zsh plugins...\"" >> ~/.zshrc
echo "zplug install" >> ~/.zshrc

# 让 plugins 生效
echo "echo \"[zplug] Applying zsh plugins...\"" >> ~/.zshrc
echo "zplug load" >> ~/.zshrc

echo "echo \"[zplug] Completed!\"" >> ~/.zshrc

echo "Done."

# source .zshrc to apply changes
exec zsh
