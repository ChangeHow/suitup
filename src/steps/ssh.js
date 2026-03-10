import * as p from "@clack/prompts";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { runStream } from "../utils/shell.js";

/**
 * Generate an SSH key for GitHub.
 * @param {object} [opts]
 * @param {string} [opts.home] - override home directory (for testing)
 */
export async function setupSsh({ home } = {}) {
  const base = home || homedir();
  const keyFile = join(base, ".ssh", "github_rsa");

  if (existsSync(keyFile)) {
    p.log.success("SSH key already exists at ~/.ssh/github_rsa");
    return;
  }

  const email = await p.text({
    message: "Enter your email for the SSH key:",
    placeholder: "you@example.com",
    validate(value) {
      if (!value) return "Email is required";
      if (!value.includes("@")) return "Please enter a valid email";
    },
  });

  if (p.isCancel(email)) return;

  p.log.step("Generating SSH key...");
  await runStream(
    `ssh-keygen -t rsa -b 4096 -C "${email}" -f "${keyFile}" -N ""`
  );

  // Copy public key to clipboard
  try {
    await runStream(`pbcopy < "${keyFile}.pub"`);
    p.log.success("SSH key generated and public key copied to clipboard");
  } catch {
    p.log.success("SSH key generated at ~/.ssh/github_rsa");
    p.log.info("Copy the public key manually: cat ~/.ssh/github_rsa.pub");
  }

  // Add to ssh-agent
  try {
    await runStream(`ssh-add "${keyFile}"`);
  } catch {
    p.log.warn("Could not add key to ssh-agent automatically");
  }
}
