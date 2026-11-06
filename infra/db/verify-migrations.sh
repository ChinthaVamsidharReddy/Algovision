#!/usr/bin/env bash
# Applies every Flyway migration (in version order) to a throwaway PostgreSQL cluster and runs verify.sql.
# Used where Docker/Maven are unavailable; CI additionally runs the real Flyway via Spring Boot tests.
# Usage: infra/db/verify-migrations.sh [pg-bin-dir]   (default /usr/lib/postgresql/16/bin; must run as root or the postgres user)
set -euo pipefail
BIN="${1:-/usr/lib/postgresql/16/bin}"
HERE="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS="$HERE/../../apps/api/src/main/resources/db/migration"
WORK="$(mktemp -d)"
PORT=54329
chmod 755 "$WORK"
run_pg() { if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$@"; else "$@"; fi; }
[ "$(id -u)" = 0 ] && chown postgres "$WORK"
trap 'run_pg "$BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT
run_pg "$BIN/initdb" -D "$WORK/data" -A trust -U postgres >/dev/null
run_pg "$BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -w -l "$WORK/log" start >/dev/null
PSQL=(psql -h "$WORK" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -c "CREATE DATABASE algovision" >/dev/null
for f in $(ls "$MIGRATIONS"/V*.sql | sort -V); do
    echo "applying $(basename "$f")"
    "${PSQL[@]}" -d algovision -f "$f" >/dev/null
done
"${PSQL[@]}" -d algovision -f "$HERE/verify.sql" -t -A | tail -1
