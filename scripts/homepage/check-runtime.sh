#!/bin/zsh

set -euo pipefail

port="${1:-3011}"
home_file="/tmp/odora-home-${port}.html"
finder_file="/tmp/odora-finder-${port}.html"
log_file="/tmp/odora-homepage-check-${port}.log"

PORT="$port" npm run start >"$log_file" 2>&1 &
pid=$!

cleanup() {
  if kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
    wait "$pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT

sleep 3

curl -sS "http://127.0.0.1:${port}/" >"$home_file"
curl -sS "http://127.0.0.1:${port}/finder?preset=Vanilla+Lovers&mood=cozy&preferredNote=vanilla" >"$finder_file"
hero_status=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/perfumes/xerjoff-naxos")
trending_status=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/perfumes/dior-sauvage-elixir")
finder_status=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/finder?preset=Vanilla+Lovers&mood=cozy&preferredNote=vanilla")

echo "[homepage routes]"
rg -o 'xerjoff-naxos|dior-sauvage-elixir|kilian-paris-angels-share|/finder\?preset=Vanilla\+Lovers[^" ]+|/perfumes/xerjoff-naxos|/perfumes/dior-sauvage-elixir' "$home_file" | sort -u

echo "[finder preset]"
rg -o 'Vanilla Lovers|Mood: Cozy|Note: Vanilla' "$finder_file" | sort -u

echo "[route status]"
echo "hero=${hero_status}"
echo "trending=${trending_status}"
echo "finder=${finder_status}"
