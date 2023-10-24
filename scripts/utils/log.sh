# 定义一些颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

color_echo() {
  COLOR=$1
  shift
  echo "${!COLOR}$@${NC}"
}

prefix_log() {
  local prefix=${2:-log}
  color_echo BLUE "[$prefix] $1"
}
