#!/usr/bin/env zsh
# =============================================================================
# Runtime behavioral tests for configs/core/perf.zsh
#
# Tests the EPOCHREALTIME guard: verifies that sourcing perf.zsh produces
# functional no-op stubs when zsh/datetime is unavailable, and full timing
# instrumentation when it is available.
#
# Usage:
#   zsh tests/perf.zsh
#
# Requires zsh. The "normal path" tests additionally require the zsh/datetime
# module (present on macOS and most Linux distributions with a full zsh build).
# =============================================================================

typeset -i _pass=0 _fail=0

PERF_ZSH="${${(%):-%x}:A:h}/../configs/core/perf.zsh"
#   ${(%):-%x}  – expands to the path of the current script
#   :A          – resolves symlinks to an absolute path
#   :h          – strips the last component (filename), leaving the directory

_ok()   { print "  ✓ $1"; (( _pass++ )); }
_fail() { print "  ✗ $1\n    expected: '$2'\n    actual:   '$3'"; (( _fail++ )); }

_assert_eq() {
  local desc="$1" expected="$2" actual="$3"
  [[ "$expected" == "$actual" ]] && _ok "$desc" || _fail "$desc" "$expected" "$actual"
}

_assert_ne() {
  local desc="$1" unexpected="$2" actual="$3"
  [[ "$unexpected" != "$actual" ]] && _ok "$desc" || _fail "$desc" "(not $unexpected)" "$actual"
}

_assert_contains() {
  local desc="$1" needle="$2" haystack="$3"
  [[ "$haystack" == *"$needle"* ]] && _ok "$desc" || _fail "$desc" "*$needle*" "$haystack"
}

# Each test case runs in a dedicated zsh subprocess for complete state isolation.
# Results (PASS/FAIL lines) are printed to stdout and the subprocess exits
# non-zero on assertion failure so the parent can tally counts.

_run() {
  local label="$1"
  local script="$2"
  local out rc
  out=$(zsh -c "$script" 2>&1)
  rc=$?
  if (( rc == 0 )); then
    _ok "$label"
  else
    _fail "$label" "exit 0" "exit $rc ($out)"
  fi
}

# =============================================================================
# 1. Fallback path: EPOCHREALTIME unavailable (zsh/datetime not loaded)
# =============================================================================

# Common preamble embedded into every fallback subprocess: override zmodload so
# the zsh/datetime module is never loaded and EPOCHREALTIME stays unset.
_FALLBACK_SETUP="
  function zmodload { :; }
  unset EPOCHREALTIME 2>/dev/null
  source '$PERF_ZSH'
"

print "\nperf.zsh – fallback path (EPOCHREALTIME unavailable):"

_run "_stage is a no-op (does not set _zsh_current_stage)" "
  $_FALLBACK_SETUP
  _stage 'test-stage'
  [[ -z \"\${_zsh_current_stage:-}\" ]]
"

_run "_zsh_report is a no-op (produces no output)" "
  $_FALLBACK_SETUP
  out=\$(_zsh_report 2>&1)
  [[ -z \"\$out\" ]]
"

_run "_zsh_stage_names array is not populated after _stage call" "
  $_FALLBACK_SETUP
  _stage 'x'
  _stage 'y'
  [[ -z \"\${_zsh_stage_names[*]:-}\" ]]
"

_run "repeated _stage calls do not raise errors" "
  $_FALLBACK_SETUP
  _stage 'a'; _stage 'b'; _stage 'c'
  true
"

_run "repeated _zsh_report calls do not raise errors" "
  $_FALLBACK_SETUP
  _zsh_report; _zsh_report
  true
"

# =============================================================================
# 2. Normal path: EPOCHREALTIME available (zsh/datetime loaded successfully)
# =============================================================================
print "\nperf.zsh – normal path (EPOCHREALTIME available):"

if ! zsh -c "zmodload zsh/datetime 2>/dev/null && (( \${+EPOCHREALTIME} ))" >/dev/null 2>&1; then
  print "  ⚠ zsh/datetime not available in this environment; skipping normal-path tests"
else
  _run "_stage sets _zsh_current_stage" "
    source '$PERF_ZSH'
    _stage 'env'
    [[ \"\$_zsh_current_stage\" == 'env' ]]
  "

  _run "_stage records the previous stage name when transitioning" "
    source '$PERF_ZSH'
    _stage 'env'
    _stage 'tools'
    [[ \"\${_zsh_stage_names[1]}\" == 'env' ]]
  "

  _run "_stage records a non-zero duration for the previous stage" "
    source '$PERF_ZSH'
    _stage 'env'
    sleep 0.01
    _stage 'tools'
    (( \${_zsh_stage_durations[1]:-0} > 0 ))
  "

  _run "_zsh_report outputs a timing table containing 'total'" "
    source '$PERF_ZSH'
    _stage 'env'
    _stage 'tools'
    out=\$(_zsh_report 2>&1)
    [[ \"\$out\" == *'total'* ]]
  "

  _run "_zsh_report is idempotent (second call produces no extra output)" "
    source '$PERF_ZSH'
    _stage 'env'
    _zsh_report >/dev/null 2>&1
    second=\$(_zsh_report 2>&1)
    [[ -z \"\$second\" ]]
  "
fi

# =============================================================================
# Summary
# =============================================================================
print "\nResults: $_pass passed, $_fail failed."
(( _fail == 0 ))
