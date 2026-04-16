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

node_linux_arch() {
  case "$(uname -m)" in
    x86_64|amd64)
      printf 'x64\n'
      ;;
    aarch64|arm64)
      printf 'arm64\n'
      ;;
    armv7l)
      printf 'armv7l\n'
      ;;
    ppc64le)
      printf 'ppc64le\n'
      ;;
    s390x)
      printf 's390x\n'
      ;;
    *)
      return 1
      ;;
  esac
}

ensure_local_bin_on_path() {
  local local_bin="${HOME}/.local/bin"

  mkdir -p "${local_bin}"
  case ":${PATH}:" in
    *:"${local_bin}":*)
      ;;
    *)
      export PATH="${local_bin}:${PATH}"
      ;;
  esac
}

install_node_runtime_linux() {
  local arch base_url archive_name archive_path install_root install_dir

  arch="$(node_linux_arch)" || {
    echo "Unsupported Linux architecture for automatic Node.js installation: $(uname -m)" >&2
    exit 1
  }

  base_url="https://nodejs.org/dist/latest-v20.x"
  archive_name="$(curl -fsSL "${base_url}/SHASUMS256.txt" | awk '/ node-v[0-9]+\.[0-9]+\.[0-9]+-linux-'"${arch}"'\.tar\.xz$/ { print $2; exit }')"
  if [[ -z "${archive_name}" ]]; then
    echo "Could not determine the latest Node.js 20.x Linux archive for architecture ${arch}." >&2
    exit 1
  fi

  archive_path="${WORK_DIR}/${archive_name}"
  install_root="${HOME}/.local/share/suitup/node"
  install_dir="${install_root}/${archive_name%.tar.xz}"

  log "Downloading official Node.js 20.x Linux archive..."
  mkdir -p "${install_root}"
  if [[ ! -x "${install_dir}/bin/node" ]]; then
    curl --fail --show-error --silent --location "${base_url}/${archive_name}" --output "${archive_path}"
    mkdir -p "${install_dir}"
    tar -xJf "${archive_path}" --strip-components=1 -C "${install_dir}"
  fi

  ensure_local_bin_on_path
  ln -sfn "${install_dir}/bin/node" "${HOME}/.local/bin/node"
  ln -sfn "${install_dir}/bin/npm" "${HOME}/.local/bin/npm"
  ln -sfn "${install_dir}/bin/npx" "${HOME}/.local/bin/npx"
  if [[ -x "${install_dir}/bin/corepack" ]]; then
    ln -sfn "${install_dir}/bin/corepack" "${HOME}/.local/bin/corepack"
  fi
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
  if [[ -z "${manager}" ]]; then
    echo "Could not detect a supported package manager to install zsh. Install zsh manually, then rerun suitup." >&2
    exit 1
  fi

  log "Installing zsh..."
  install_with_manager "${manager}" zsh
}

ensure_node_runtime() {
  local manager="$1"
  local major

  if have_cmd node && have_cmd npm; then
    major="$(node_major)"
    if [[ -n "${major}" && "${major}" -ge 20 ]]; then
      return 0
    fi
  fi

  log "Installing Node.js and npm..."
  case "${manager}" in
    brew)
      install_with_manager "${manager}" node
      ;;
    "")
      if [[ "${OS_NAME}" != "Linux" ]]; then
        echo "No supported package manager available to install Node.js." >&2
        exit 1
      fi
      install_node_runtime_linux
      ;;
    apt-get|dnf|yum)
      install_node_runtime_linux
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
  if [[ -z "${major}" || "${major}" -lt 20 ]]; then
    echo "suitup requires Node.js 20 or later. Installed version is $(node -v)." >&2
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
ensure_zsh "${PACKAGE_MANAGER}"
ensure_node_runtime "${PACKAGE_MANAGER}"

if [[ $# -gt 0 ]]; then
  CLI_COMMAND="$1"
  shift
elif [[ -r /dev/tty ]]; then
  echo '' >&2
  echo 'How would you like to run suitup?' >&2
  echo '  1) setup  — interactive, choose each step yourself' >&2
  echo '  2) init   — non-interactive, install everything with recommended defaults' >&2
  echo '' >&2
  read -r -p 'Enter 1 or 2 [default: 1]: ' _suitup_choice < /dev/tty
  case "${_suitup_choice}" in
    2) CLI_COMMAND="init" ;;
    *) CLI_COMMAND="setup" ;;
  esac
else
  CLI_COMMAND="setup"
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
