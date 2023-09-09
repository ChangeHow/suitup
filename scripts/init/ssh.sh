#!/bin/bash
source $(pwd)/scripts/utils/log.sh

prefix="ssh"

# SSH key generation
ssh_keygen_type="rsa"
ssh_key_file="github_${ssh_keygen_type}"
# check if the ssh key file already exists
if [ -f ~/.ssh/$ssh_key_file ]; then
    prefix_log "SSH key already exists. Please delete it and run this script again." $prefix
    exit 1
fi

# Input email
prefix_log "Generating SSH key..." $prefix
read -p "Please enter your email: " email

ssh-keygen -t ${ssh_keygen_type} -b 4096 -C "${email}" -f ~/.ssh/$ssh_key_file

# Copy ssh key to clipboard
if command -v xclip >/dev/null; then
    xclip -selection clipboard <~/.ssh/$ssh_key_file
elif command -v pbcopy >/dev/null; then
    pbcopy <~/.ssh/$ssh_key_file.pub
else
    prefix_log "Could not find any command to copy content to clipboard." $prefix
    prefix_log "Please install xclip or pbcopy." $prefix
    exit 1
fi

# Check ssh-client
if command -v ssh-add >/dev/null; then
    ssh-add ~/.ssh/$ssh_key_file
else
    prefix_log "Could not find the ssh client." $prefix
    prefix_log "Please install ssh client and then run this script again." $prefix
    exit 1
fi

prefix_log "SSH key has been generated and copied to clipboard. You can now add it to your GitHub account." $prefix
