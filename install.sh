#!/usr/bin/env bash

set -euo pipefail

REPO_SLUG="ChangeHow/suitup"
SUITUP_REF="${SUITUP_REF:-main}"
ARCHIVE_URL="https://github.com/${REPO_SLUG}/archive/refs/heads/${SUITUP_REF}.tar.gz"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/suitup-install.XXXXXX")"
ARCHIVE_PATH="${WORK_DIR}/suitup.tar.gz"
OS_NAME="$(uname -s)"

cleanup() {
  rm -rf "${WORK_DIR}"
}

trap cleanup EXIT

log() {
  printf '==> %s\n' "$1" >&2
}

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

require_cmd() {
  if have_cmd "$1"; then
    return 0
  fi

  echo "suitup install.sh requires '$1' to be installed first." >&2
  exit 1
}

activate_brew() {
  local brew_bin
  for brew_bin in \
    /opt/homebrew/bin/brew \
    /home/linuxbrew/.linuxbrew/bin/brew \
    /usr/local/bin/brew
  do
    if [[ -x "${brew_bin}" ]]; then
      eval "$("${brew_bin}" shellenv)"
      return 0
    fi
  done

  return 1
}

ensure_homebrew_on_mac() {
  if have_cmd brew; then
    activate_brew || true
    return 0
  fi

  log "Installing Homebrew..."
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  activate_brew
}

detect_package_manager() {
  if [[ "${OS_NAME}" == "Darwin" ]]; then
    ensure_homebrew_on_mac
    printf 'brew\n'
    return 0
  fi

  local manager
  for manager in apt-get dnf yum brew; do
    if have_cmd "${manager}"; then
      printf '%s\n' "${manager}"
      return 0
    fi
  done

  return 1
}

install_with_manager() {
  local manager="$1"
  shift

  case "${manager}" in
    brew)
      brew install "$@"
      ;;
    apt-get)
      sudo apt-get update
      sudo apt-get install -y "$@"
      ;;
    dnf)
      sudo dnf install -y "$@"
      ;;
    yum)
      sudo yum install -y "$@"
      ;;
    *)
      echo "Unsupported package manager: ${manager}" >&2
      exit 1
      ;;
  esac
}

node_major() {
  if ! have_cmd node; then
    return 1
  fi

  node -p 'process.versions.node.split(".")[0]'
}

ensure_zsh() {
  if have_cmd zsh; then
    return 0
  fi

  local manager="$1"
  log "Installing zsh..."
  install_with_manager "${manager}" zsh
}

ensure_node_runtime() {
  local manager="$1"
  local major

  if have_cmd node && have_cmd npm; then
    major="$(node_major)"
    if [[ -n "${major}" && "${major}" -ge 18 ]]; then
      return 0
    fi
  fi

  log "Installing Node.js and npm..."
  case "${manager}" in
    brew)
      install_with_manager "${manager}" node
      ;;
    apt-get)
      install_with_manager "${manager}" nodejs npm
      ;;
    dnf|yum)
      install_with_manager "${manager}" nodejs npm
      ;;
    *)
      echo "No supported package manager available to install Node.js." >&2
      exit 1
      ;;
  esac

  if ! have_cmd node || ! have_cmd npm; then
    echo "Failed to install Node.js/npm automatically." >&2
    exit 1
  fi

  major="$(node_major)"
  if [[ -z "${major}" || "${major}" -lt 18 ]]; then
    echo "suitup requires Node.js 18 or later. Installed version is $(node -v)." >&2
    exit 1
  fi
}

launch_cli() {
  local repo_dir="$1"
  shift

  if [[ -r /dev/tty ]]; then
    zsh -lc 'cd "$1" && shift && node src/cli.js "$@"' -- "${repo_dir}" "$@" < /dev/tty
  else
    zsh -lc 'cd "$1" && shift && node src/cli.js "$@"' -- "${repo_dir}" "$@"
  fi
}

require_cmd curl
require_cmd tar
require_cmd uname

PACKAGE_MANAGER="$(detect_package_manager || true)"
if [[ -z "${PACKAGE_MANAGER}" ]]; then
  echo "Could not detect a supported package manager. Install zsh and Node.js 18+ manually, then rerun suitup." >&2
  exit 1
fi

ensure_zsh "${PACKAGE_MANAGER}"
ensure_node_runtime "${PACKAGE_MANAGER}"

CLI_COMMAND="${1:-init}"
if [[ $# -gt 0 ]]; then
  shift
fi

case "${CLI_COMMAND}" in
  init|setup|append|verify|clean|migrate-paths|help|--help|-h)
    ;;
  *)
    echo "Unknown command: ${CLI_COMMAND}" >&2
    exit 1
    ;;
esac

log "Downloading ${REPO_SLUG}@${SUITUP_REF}..."
curl --fail --show-error --silent --location "${ARCHIVE_URL}" --output "${ARCHIVE_PATH}"

log "Extracting archive..."
mkdir -p "${WORK_DIR}/repo"
tar -xzf "${ARCHIVE_PATH}" --strip-components=1 -C "${WORK_DIR}/repo"

log "Installing suitup dependencies..."
cd "${WORK_DIR}/repo"
npm ci --no-fund --no-audit

log "Launching suitup inside zsh..."
launch_cli "${WORK_DIR}/repo" "${CLI_COMMAND}" "$@"
