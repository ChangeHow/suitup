prefix_log() {
  local prefix=${2:-log}
  echo "[$prefix] $1"
}