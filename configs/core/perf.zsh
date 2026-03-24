# ============================================================================
# Startup timing and performance report
# ============================================================================

zmodload zsh/datetime 2>/dev/null

if (( ! ${+EPOCHREALTIME} )); then
  # zsh/datetime unavailable; define no-op stubs so _stage/_zsh_report calls still succeed
  _stage() { :; }
  _zsh_report() { :; }
  return
fi

typeset -ga _zsh_stage_names
typeset -ga _zsh_stage_durations
typeset -g _zsh_report_called
typeset -g _zsh_current_stage
typeset -gF 6 _zsh_start_time
typeset -gF 6 _zsh_stage_started_at

_zsh_start_time=${EPOCHREALTIME:-0}
_zsh_stage_started_at=$_zsh_start_time
_zsh_stage_names=()
_zsh_stage_durations=()
_zsh_report_called=false
_zsh_current_stage=''

_record_stage_duration() {
  [[ -z "$_zsh_current_stage" ]] && return

  local -F 6 now=${EPOCHREALTIME:-0}
  local elapsed_ms=$(( (now - _zsh_stage_started_at) * 1000.0 ))

  _zsh_stage_names+=("$_zsh_current_stage")
  _zsh_stage_durations+=("${elapsed_ms}")
  _zsh_stage_started_at=$now
}

_stage() {
  _record_stage_duration
  _zsh_current_stage="$1"
}

_print_duration_row() {
  local name="$1"
  local raw_ms="$2"
  local rounded_ms=$(printf '%.0f' "$raw_ms")

  if (( rounded_ms > 1000 )); then
    local sec=$(( rounded_ms / 1000 ))
    local rem=$(( rounded_ms % 1000 ))
    printf '│ %-10s %12d.%01ds │\n' "$name" "$sec" "$(( rem / 100 ))"
  else
    printf '│ %-10s %13dms │\n' "$name" "$rounded_ms"
  fi
}

_zsh_report() {
  [[ "$_zsh_report_called" == "true" ]] && return
  _zsh_report_called=true

  _record_stage_duration

  local -F 6 end=${EPOCHREALTIME:-0}
  local -F 6 total_ms=$(( (end - _zsh_start_time) * 1000.0 ))
  local i

  echo ''
  echo '┌────────────────────────────┐'

  for i in {1..${#_zsh_stage_names}}; do
    _print_duration_row "${_zsh_stage_names[$i]}" "${_zsh_stage_durations[$i]}"
  done

  echo '├────────────────────────────┤'
  _print_duration_row 'total' "$total_ms"
  echo '└────────────────────────────┘'

  if [[ "${_zsh_completion_cache_mode:-}" == 'cache-hit' && -n "${_zsh_compdump_file:-}" ]]; then
    printf 'completion cache hit; remove %s to rebuild\n' "$_zsh_compdump_file"
  fi
}
