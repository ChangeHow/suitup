#!/usr/bin/env bash

set -euo pipefail

REPO_SLUG="ChangeHow/suitup"
SUITUP_REF="${SUITUP_REF:-main}"
ARCHIVE_URL="https://github.com/${REPO_SLUG}/archive/refs/heads/${SUITUP_REF}.tar.gz"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/suitup-install.XXXXXX")"
ARCHIVE_PATH="${WORK_DIR}/suitup.tar.gz"

cleanup() {
  rm -rf "${WORK_DIR}"
}

trap cleanup EXIT

require_cmd() {
  if command -v "$1" >/dev/null 2>&1; then
    return 0
  fi

  echo "suitup install.sh requires '$1' to be installed first." >&2
  exit 1
}

require_cmd curl
require_cmd tar
require_cmd zsh
require_cmd node
require_cmd npm

node -e '
const major = Number(process.versions.node.split(".")[0]);
if (major < 18) {
  console.error(`suitup requires Node.js 18 or later. You are running ${process.version}.`);
  process.exit(1);
}
'

CLI_COMMAND="${1:-}"
if [[ -n "${CLI_COMMAND}" ]]; then
  shift
  if [[ "${CLI_COMMAND}" == "init" ]]; then
    CLI_COMMAND="setup"
  fi
else
  echo "Choose install mode:"
  echo "  1) init   - full interactive setup"
  echo "  2) append - incremental config updates for an existing ~/.zshrc"
  read -r -p "Select [1-2] (default 1): " INSTALL_MODE < /dev/tty
  case "${INSTALL_MODE:-1}" in
    1)
      CLI_COMMAND="setup"
      ;;
    2)
      CLI_COMMAND="append"
      ;;
    *)
      echo "Invalid selection: ${INSTALL_MODE}. Please enter 1 for init or 2 for append." >&2
      exit 1
      ;;
  esac
fi

echo "Downloading ${REPO_SLUG}@${SUITUP_REF}..."
curl --fail --show-error --silent --location "${ARCHIVE_URL}" --output "${ARCHIVE_PATH}"

echo "Extracting archive..."
mkdir -p "${WORK_DIR}/repo"
tar -xzf "${ARCHIVE_PATH}" --strip-components=1 -C "${WORK_DIR}/repo"

echo "Installing suitup dependencies..."
cd "${WORK_DIR}/repo"
npm ci --no-fund --no-audit

echo "Launching suitup inside zsh..."
zsh -lc 'cd "$1" && shift && node src/cli.js "$@"' -- "${WORK_DIR}/repo" "${CLI_COMMAND}" "$@" < /dev/tty
