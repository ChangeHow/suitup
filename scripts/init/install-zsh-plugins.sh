#!/bin/zsh
source $(pwd)/scripts/utils/log.sh
source $(pwd)/scripts/init/init-configs.sh

prefix="zsh"
plugin_file=$HOME/.config/suitup/plugins

# 检查 .zshrc 文件是否存在
if [ -f "$HOME/.zshrc" ]; then
    prefix_log ".zshrc file exists." $prefix
else
    prefix_log ".zshrc file does not exist." $prefix
    exit 1
fi

# 通过 brew 安装 zplug
if brew list zplug >/dev/null 2>&1; then
    prefix_log "zplug is already installed." $prefix
else
    prefix_log "installing zplug..." $prefix
    brew install zplug
fi

# 将 zplug 配置添加到插件文件
echo "source $(brew --prefix)/opt/zplug/init.zsh" > $plugin_file 

# 使用 zplug 安装插件
prefix_log "installing plugins with zplug..." $prefix
echo "zplug 'zsh-users/zsh-autosuggestions'" >> $plugin_file 
echo "zplug 'zsh-users/zsh-syntax-highlighting'" >> $plugin_file 
# echo "zplug 'junegunn/fzf', as:command, use:'bin/*'" >> $plugin_file

# 在 .zshrc 中添加提示
echo "echo \"[zplug] Updating zsh plugins...\"" >> $HOME/.zshrc
echo "zplug install" >> $HOME/.zshrc

# 让 plugins 生效
echo "echo \"[zplug] Applying zsh plugins...\"" >> $HOME/.zshrc
echo "zplug load" >> $HOME/.zshrc

echo "echo \"[zplug] Completed!\"" >> $HOME/.zshrc

prefix_log "here are plugins:" $prefix
cat $plugin_file

prefix_log "completed." $prefix

# source .zshrc to apply changes
exec zsh
