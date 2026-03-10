import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createSandbox } from "./helpers.js";

const { mockText, mockPassword } = vi.hoisted(() => ({
  mockText: vi.fn(),
  mockPassword: vi.fn(),
}));

vi.mock("@clack/prompts", () => ({
  log: { success: vi.fn(), step: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  confirm: vi.fn(),
  text: mockText,
  password: mockPassword,
  isCancel: vi.fn(() => false),
}));

vi.mock("../src/utils/shell.js", () => ({
  commandExists: vi.fn(),
  brewInstalled: vi.fn(),
  brewInstall: vi.fn(() => true),
  run: vi.fn(() => ""),
  runStream: vi.fn(() => Promise.resolve(0)),
}));

import { setupSsh } from "../src/steps/ssh.js";
import { runStream } from "../src/utils/shell.js";

describe("ssh step", () => {
  let sandbox;

  beforeEach(() => {
    vi.clearAllMocks();
    sandbox = createSandbox();
    mockText.mockResolvedValue("test@example.com");
    mockPassword.mockResolvedValue("");
  });

  afterEach(() => {
    sandbox.cleanup();
  });

  test("skips when SSH key already exists", async () => {
    // Create the key file
    mkdirSync(join(sandbox.path, ".ssh"), { recursive: true });
    writeFileSync(join(sandbox.path, ".ssh", "github_rsa"), "key-content", "utf-8");

    await setupSsh({ home: sandbox.path });

    expect(runStream).not.toHaveBeenCalled();
    expect(mockText).not.toHaveBeenCalled();
  });

  test("generates SSH key when not present", async () => {
    await setupSsh({ home: sandbox.path });

    expect(mockText).toHaveBeenCalled();
    const sshKeygenCall = runStream.mock.calls.find((c) => c[0].includes("ssh-keygen"));
    expect(sshKeygenCall).toBeDefined();
    expect(sshKeygenCall[0]).toContain("test@example.com");
  });

  test("uses sandbox path for key file location", async () => {
    await setupSsh({ home: sandbox.path });

    const sshKeygenCall = runStream.mock.calls.find((c) => c[0].includes("ssh-keygen"));
    expect(sshKeygenCall).toBeDefined();
    expect(sshKeygenCall[0]).toContain(sandbox.path);
  });

  test("generates key without passphrase when left blank", async () => {
    mockPassword.mockResolvedValue("");

    await setupSsh({ home: sandbox.path });

    const sshKeygenCall = runStream.mock.calls.find((c) => c[0].includes("ssh-keygen"));
    expect(sshKeygenCall).toBeDefined();
    expect(sshKeygenCall[0]).toContain('-N "$SSH_KEYGEN_PASSPHRASE"');
    expect(sshKeygenCall[1]).toEqual({ env: expect.objectContaining({ SSH_KEYGEN_PASSPHRASE: "" }) });
  });

  test("generates key with passphrase when provided", async () => {
    mockPassword.mockResolvedValue("s3cr3tPass");

    await setupSsh({ home: sandbox.path });

    const sshKeygenCall = runStream.mock.calls.find((c) => c[0].includes("ssh-keygen"));
    expect(sshKeygenCall).toBeDefined();
    expect(sshKeygenCall[0]).toContain('-N "$SSH_KEYGEN_PASSPHRASE"');
    expect(sshKeygenCall[1]).toEqual({ env: expect.objectContaining({ SSH_KEYGEN_PASSPHRASE: "s3cr3tPass" }) });
  });

  test("aborts when passphrase prompt is cancelled", async () => {
    const { isCancel } = await import("@clack/prompts");
    isCancel.mockImplementationOnce(() => false); // email not cancelled
    isCancel.mockImplementationOnce(() => true);  // passphrase is cancelled
    mockPassword.mockResolvedValue("s3cr3tPass");

    await setupSsh({ home: sandbox.path });

    expect(runStream).not.toHaveBeenCalled();
  });

  test("prompts for passphrase after email", async () => {
    await setupSsh({ home: sandbox.path });

    expect(mockPassword).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("passphrase") })
    );
  });
});
