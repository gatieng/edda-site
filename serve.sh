#!/usr/bin/env bash
# Sert la copie locale du site sur http://localhost:8080
# Usage : ./serve.sh [port]
set -euo pipefail
PORT="${1:-8080}"
cd "$(dirname "$0")/site"
echo "→ Site servi sur http://localhost:${PORT}/index.html"
echo "  (Ctrl+C pour arrêter)"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
