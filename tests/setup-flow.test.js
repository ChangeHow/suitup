import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  mockNote,
  mockOutro,
  mockMultiSelect,
  mockSelect,
  mockGroupMultiselect,
  mockCancel,
  mockStep,
} = vi.hoisted(() => ({
  mockNote: vi.fn(),
  mockOutro: vi.fn(),
  mockMultiSelect: vi.fn(),
  mockSelect: vi.fn(),
  mockGroupMultiselect: vi.fn(),
  mockCancel: vi.fn(),
  mockStep: vi.fn(),
}));

const bootstrap = vi.hoisted(() => vi.fn());
const setupZshConfig = vi.hoisted(() => vi.fn());
const writeZshrc = vi.hoisted(() => vi.fn());
const writeZshenv = vi.hoisted(() => vi.fn());
const installCliTools = vi.hoisted(() => vi.fn());

vi.mock("@clack/prompts", () => ({
  note: mockNote,
  outro: mockOutro,
  cancel: mockCancel,
  isCancel: vi.fn(() => false),
  multiselect: mockMultiSelect,
  select: mockSelect,
  groupMultiselect: mockGroupMultiselect,
  log: {
    success: vi.fn(),
    step: mockStep,
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../src/utils/shell-context.js", () => ({
  isZshShell: vi.fn(() => true),
}));

vi.mock("../src/steps/bootstrap.js", () => ({
  bootstrap,
}));

vi.mock("../src/steps/zsh-config.js", () => ({
  setupZshConfig,
  writeZshrc,
  writeZshenv,
}));

vi.mock("../src/steps/plugin-manager.js", () => ({
  installZinit: vi.fn(),
}));

vi.mock("../src/steps/cli-tools.js", () => ({
  CLI_TOOLS: {
    essentials: [{ value: "bat", label: "bat" }],
    shell: [{ value: "fzf", label: "fzf" }],
    optional: [],
  },
  installCliTools,
}));

vi.mock("../src/steps/apps.js", () => ({
  APPS: {
    recommended: [],
    optional: [],
    fonts: [],
  },
  installApps: vi.fn(),
}));

vi.mock("../src/steps/frontend.js", () => ({
  installFrontendTools: vi.fn(),
}));

vi.mock("../src/steps/ssh.js", () => ({
  setupSsh: vi.fn(),
}));

vi.mock("../src/steps/vim.js", () => ({
  setupVim: vi.fn(),
}));

vi.mock("../src/steps/aliases.js", () => ({
  setupAliases: vi.fn(),
}));

vi.mock("../src/steps/dock.js", () => ({
  cleanDock: vi.fn(),
}));

import { runSetup } from "../src/setup.js";

describe("setup flow ordering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMultiSelect.mockResolvedValue(["zsh-config", "bootstrap", "cli-tools"]);
    mockSelect.mockResolvedValue("basic");
    mockGroupMultiselect.mockResolvedValue(["bat"]);
  });

  test("completes zsh config before Linux bootstrap rerun and skips later prompts", async () => {
    bootstrap.mockResolvedValue({ manager: "brew", shouldRerun: true });

    await runSetup();

    expect(setupZshConfig).toHaveBeenCalledWith({ promptTheme: "basic" });
    expect(writeZshrc).toHaveBeenCalledWith("zinit");
    expect(writeZshenv).toHaveBeenCalled();
    expect(bootstrap).toHaveBeenCalledWith({ defaults: false });
    expect(setupZshConfig.mock.invocationCallOrder[0]).toBeLessThan(bootstrap.mock.invocationCallOrder[0]);
    expect(mockGroupMultiselect).not.toHaveBeenCalled();
    expect(installCliTools).not.toHaveBeenCalled();
    expect(mockOutro).toHaveBeenCalledWith(
      "Homebrew installed. Rerun suitup to continue with the remaining setup steps."
    );
  });

  test("continues with later selections when bootstrap does not require a rerun", async () => {
    bootstrap.mockResolvedValue({ manager: "apt-get", shouldRerun: false });

    await runSetup();

    expect(mockGroupMultiselect).toHaveBeenCalledWith({
      message: "Select CLI tools to install:",
      required: true,
      options: {
        Essentials: [{ value: "bat", label: "bat" }],
        "Shell Enhancement": [{ value: "fzf", label: "fzf" }],
        Optional: [],
      },
    });
    expect(installCliTools).toHaveBeenCalledWith(["bat"]);
  });
});
