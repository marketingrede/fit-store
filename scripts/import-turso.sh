#!/usr/bin/env bash
set -euo pipefail

ROOT="/mnt/c/Users/raillen.DESKTOP-99RJ5M6/Documents/Projetos/movimenta+"
cd "$ROOT"

URL="$(~/.turso/turso db show fit-store | grep 'libsql://' | awk '{print $2}')"
TOKEN="$(~/.turso/turso db tokens create fit-store 2>/dev/null | tail -n1)"

echo "URL=$URL"
echo "token_len=${#TOKEN}"

echo "Aguardando banco ficar pronto..."
sleep 20

for attempt in 1 2 3 4 5; do
  if docker run --rm \
    -v "$ROOT:/var/www/html" \
    -e "TURSO_DATABASE_URL=$URL" \
    -e "TURSO_AUTH_TOKEN=$TOKEN" \
    movimenta-app \
    php scripts/import-turso.php data/fit-store-import.sql; then
    break
  fi
  echo "Tentativa $attempt falhou, aguardando 10s..."
  sleep 10
done

~/.turso/turso db shell fit-store "SELECT COUNT(*) AS products FROM products; SELECT COUNT(*) AS users FROM users;"
