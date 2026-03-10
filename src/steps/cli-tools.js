import * as p from "@clack/prompts";
import { brewInstalled, brewInstall } from "../utils/shell.js";

/** All available CLI tools with metadata. */
export const CLI_TOOLS = {
  essentials: [
    { value: "bat", label: "bat", hint: "cat replacement with syntax highlighting" },
    { value: "eza", label: "eza", hint: "modern ls replacement" },
    { value: "fzf", label: "fzf", hint: "fuzzy finder" },
    { value: "fd", label: "fd", hint: "find replacement" },
  ],
  shell: [
    { value: "atuin", label: "atuin", hint: "shell history search" },
    { value: "zoxide", label: "zoxide", hint: "smarter cd" },
    { value: "ripgrep", label: "ripgrep", hint: "fast grep" },
  ],
  optional: [
    { value: "htop", label: "htop", hint: "process viewer" },
    { value: "tree", label: "tree", hint: "directory tree" },
    { value: "jq", label: "jq", hint: "JSON processor" },
  ],
};

/**
 * Install selected CLI tools via Homebrew.
 * @param {string[]} tools - list of brew formula names
 */
export async function installCliTools(tools) {
  for (const tool of tools) {
    if (brewInstalled(tool)) {
      p.log.success(`${tool} is already installed`);
    } else {
      const s = p.spinner();
      s.start(`Installing ${tool}...`);
      const ok = brewInstall(tool);
      if (ok) {
        s.stop(`${tool} installed`);
      } else {
        s.stop(`Failed to install ${tool}`);
      }
    }
  }
}
