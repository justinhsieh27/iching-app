#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-5173}"
HOST="${HOST:-0.0.0.0}"
PID_FILE="${PID_FILE:-${ROOT_DIR}/iching-app.pid}"
LOG_DIR="${LOG_DIR:-${ROOT_DIR}/logs}"
LOG_FILE="${LOG_FILE:-${LOG_DIR}/iching-app.log}"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed. Run ./install.sh after installing Node.js 18 or newer."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed. Run ./install.sh after installing npm."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Installing dependencies first..."
  npm install
fi

mkdir -p "$LOG_DIR"

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti "tcp:${PORT}" || true)"
  if [ -n "$PIDS" ]; then
    echo "Port ${PORT} is in use. Stopping existing process(es): ${PIDS}"
    kill $PIDS || true
    sleep 1

    REMAINING_PIDS="$(lsof -ti "tcp:${PORT}" || true)"
    if [ -n "$REMAINING_PIDS" ]; then
      echo "Some process(es) are still using port ${PORT}. Force stopping: ${REMAINING_PIDS}"
      kill -9 $REMAINING_PIDS || true
    fi
  fi
else
  echo "Warning: lsof is not available; cannot check whether port ${PORT} is already in use."
fi

echo "Starting I Ching app in the background..."
echo "Host: ${HOST}"
echo "Port: ${PORT}"
echo "Log:  ${LOG_FILE}"

nohup ./node_modules/.bin/vite --host "$HOST" --port "$PORT" --strictPort > "$LOG_FILE" 2>&1 < /dev/null &
APP_PID=$!
echo "$APP_PID" > "$PID_FILE"
disown "$APP_PID" 2>/dev/null || true

sleep 2

if ! kill -0 "$APP_PID" >/dev/null 2>&1; then
  echo "Error: failed to start the app. See log:"
  echo "  ${LOG_FILE}"
  rm -f "$PID_FILE"
  exit 1
fi

echo "App started."
echo "PID: ${APP_PID}"
echo "Local URL:   http://127.0.0.1:${PORT}/"
echo "Network URL: http://<this-machine-ip>:${PORT}/"
echo
echo "To view logs:"
echo "  tail -f ${LOG_FILE}"
echo "To stop:"
echo "  kill ${APP_PID}"
