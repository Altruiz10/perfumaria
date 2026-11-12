#!/usr/bin/env bash
# Start the production server on :3100 in the background, replacing any previous one.
set -e
PORT=${PORT:-3100}
for d in /proc/[0-9]*; do
  if tr '\0' ' ' < "$d/cmdline" 2>/dev/null | grep -q '^next-server'; then kill "${d#/proc/}" 2>/dev/null || true; fi
done
sleep 1
nohup node node_modules/next/dist/bin/next start -p "$PORT" > "${LOG:-/tmp/hm-server.log}" 2>&1 &
for i in $(seq 1 30); do curl -sf -o /dev/null "http://localhost:$PORT/pt" && echo "up on :$PORT" && exit 0; sleep 0.5; done
echo "server failed"; tail -20 "${LOG:-/tmp/hm-server.log}"; exit 1
