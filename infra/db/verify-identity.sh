#!/usr/bin/env bash
# Runs the exact SQL files used by the JDBC identity stores (apps/api/src/main/resources/sql/identity) against a
# throwaway PostgreSQL built from the Flyway migrations, and checks their behaviour: case-insensitive email, unique
# violations, role assignment, the refresh-token constraints, and the atomic "exactly one rotation wins" update.
# Named parameters (:name) are bound with psql variables holding quoted literals. Usage: infra/db/verify-identity.sh [pg-bin-dir]
set -euo pipefail
BIN="${1:-/usr/lib/postgresql/16/bin}"
HERE="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS="$HERE/../../apps/api/src/main/resources/db/migration"
SQLDIR="$HERE/../../apps/api/src/main/resources/sql/identity"
WORK="$(mktemp -d)"; PORT=54331
chmod 755 "$WORK"
run_pg() { if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$@"; else "$@"; fi; }
[ "$(id -u)" = 0 ] && chown postgres "$WORK"
trap 'run_pg "$BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT
run_pg "$BIN/initdb" -D "$WORK/data" -A trust -U postgres >/dev/null
run_pg "$BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -w -l "$WORK/log" start >/dev/null
psql_base=(psql -h "$WORK" -p "$PORT" -U postgres -q)
"${psql_base[@]}" -c "CREATE DATABASE algovision" >/dev/null
for f in $(ls "$MIGRATIONS"/V*.sql | sort -V); do "${psql_base[@]}" -v ON_ERROR_STOP=1 -d algovision -f "$f" >/dev/null; done

PASS=0; FAILN=0
ok() { PASS=$((PASS+1)); echo "PASS  $1"; }
bad() { FAILN=$((FAILN+1)); echo "FAIL  $1  -> $2"; }
# q <file> name=value ...   (values are quoted literals; prints the raw psql output, with command tags)
q() { local f="$1"; shift; local args=(); for kv in "$@"; do args+=(-v "${kv%%=*}='${kv#*=}'"); done
      "${psql_base[@]}" -d algovision -t -A -v ON_ERROR_STOP=1 -f "$SQLDIR/$f.sql" "${args[@]}" 2>&1; }
# psql -q hides command tags, so statements whose row count matters go through this wrapper instead.
count() { local f="$1"; shift; local args=(); for kv in "$@"; do args+=(-v "${kv%%=*}='${kv#*=}'"); done
          # stdin (not -c) so psql substitutes :name variables
          { printf 'WITH r AS ('; sed -e 's/;[[:space:]]*$//' "$SQLDIR/$f.sql"; printf ' RETURNING 1) SELECT count(*) FROM r;\n'; } \
              | "${psql_base[@]}" -d algovision -t -A -v ON_ERROR_STOP=1 "${args[@]}" 2>&1; }
expect_eq() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1" "expected '$3' got '$2'"; fi; }
expect_has() { if grep -q -- "$3" <<<"$2"; then ok "$1"; else bad "$1" "expected to contain '$3' got '$2'"; fi; }

HASH='pbkdf2-sha256$600000$c2FsdA==$aGFzaA=='
U1=$(q create-user email=ada@example.com hash="$HASH" name="Ada Lovelace")
expect_has "create-user returns the new id (uuid)" "$U1" '^[0-9a-f-]\{36\}$'
expect_eq "find by email is case-insensitive (citext)" "$(q find-user-by-email email=ADA@Example.COM | cut -d'|' -f2)" "ada@example.com"
expect_eq "find by id returns ACTIVE status" "$(q find-user-by-id id="$U1" | cut -d'|' -f5)" "ACTIVE"
expect_eq "new users get exactly ROLE_STUDENT" "$(q user-roles id="$U1")" "ROLE_STUDENT"
OUT=$(q create-user email=ADA@EXAMPLE.COM hash="$HASH" name="Other" || true)
expect_has "duplicate email (different case) hits uq_users_email" "$OUT" "uq_users_email"
expect_eq "the failed duplicate left no extra user" "$("${psql_base[@]}" -d algovision -t -A -c 'SELECT count(*) FROM users')" "1"
OUT=$(q create-user email=not-an-email hash="$HASH" name="X" || true)
expect_has "malformed email is rejected by the database check" "$OUT" "ck_users_email_shape"
OUT=$(q create-user email=b@example.com hash="$HASH" name="   " || true)
expect_has "blank name is rejected by the database check" "$OUT" "full_name"
expect_eq "record-login updates one row" "$(count record-login at=2026-01-01T00:00:00Z id="$U1")" "1"
expect_eq "update-password updates one row" "$(count update-password hash=new id="$U1")" "1"
expect_eq "unknown user: find returns nothing" "$(q find-user-by-email email=ghost@example.com)" ""

F1=$("${psql_base[@]}" -d algovision -t -A -c "SELECT gen_random_uuid()")
T1=$(printf 'a%.0s' $(seq 64)); T2=$(printf 'b%.0s' $(seq 64)); T3=$(printf 'c%.0s' $(seq 64))
ins() { q rt-insert id="$(cat /proc/sys/kernel/random/uuid)" userId="$U1" familyId="$1" tokenHash="$2" issuedAt=2026-01-01T00:00:00Z expiresAt=2026-01-15T00:00:00Z userAgent=ua; }
ins "$F1" "$T1" >/dev/null; ins "$F1" "$T2" >/dev/null; ins "$F1" "$T3" >/dev/null
OUT=$(ins "$F1" "$T1" || true); expect_has "token hashes are unique" "$OUT" "uq_refresh_tokens_hash"
OUT=$(ins "$F1" "NOT-HEX" || true); expect_has "token hash must be 64 lower-case hex" "$OUT" "ck_refresh_tokens_hash"
OUT=$(q rt-insert id="$(cat /proc/sys/kernel/random/uuid)" userId="$U1" familyId="$F1" tokenHash="$(printf 'd%.0s' $(seq 64))" issuedAt=2026-01-15T00:00:00Z expiresAt=2026-01-01T00:00:00Z userAgent=ua || true)
expect_has "expiry must be after issue" "$OUT" "ck_refresh_tokens_expiry"
ROW=$(q rt-find tokenHash="$T1"); ID1=$(cut -d'|' -f1 <<<"$ROW")
expect_eq "rt-find returns the family and a null rotated_at" "$(cut -d'|' -f3,7 <<<"$ROW")" "$F1|"
expect_eq "first rotation wins" "$(count rt-mark-rotated at=2026-01-02T00:00:00Z id="$ID1")" "1"
expect_eq "second rotation of the same token changes nothing" "$(count rt-mark-rotated at=2026-01-02T00:00:00Z id="$ID1")" "0"

# Race: 8 sessions rotate the same token at once; the database must let exactly one succeed.
ID2=$(q rt-find tokenHash="$T2" | cut -d'|' -f1)
for i in 1 2 3 4 5 6 7 8; do count rt-mark-rotated at=2026-01-02T00:00:00Z id="$ID2" > "$WORK/race$i" & done; wait
WINS=$(cat "$WORK"/race* | grep -c '^1$' || true)
expect_eq "8 concurrent rotations: exactly one wins" "$WINS" "1"

expect_eq "revoke-family revokes every still-active token" "$(count rt-revoke-family at=2026-01-03T00:00:00Z familyId="$F1")" "3"
expect_eq "revoking again changes nothing" "$(count rt-revoke-family at=2026-01-03T00:00:00Z familyId="$F1")" "0"
ID3=$(q rt-find tokenHash="$T3" | cut -d'|' -f1)
expect_eq "a revoked token can no longer be rotated" "$(count rt-mark-rotated at=2026-01-04T00:00:00Z id="$ID3")" "0"
F2=$("${psql_base[@]}" -d algovision -t -A -c "SELECT gen_random_uuid()")
ins "$F2" "$(printf 'e%.0s' $(seq 64))" >/dev/null
expect_eq "revoke-family leaves other families alone" "$(count rt-revoke-user at=2026-01-05T00:00:00Z userId="$U1")" "1"
# ---- password reset tokens ----
R1=$(printf '1%.0s' $(seq 64)); R2=$(printf '2%.0s' $(seq 64)); R3=$(printf '3%.0s' $(seq 64))
rins() { q pr-insert id="$(cat /proc/sys/kernel/random/uuid)" userId="$U1" tokenHash="$1" createdAt=2026-02-01T00:00:00Z expiresAt=2026-02-01T00:30:00Z; }
rins "$R1" >/dev/null; rins "$R2" >/dev/null
OUT=$(rins "$R1" || true); expect_has "reset token hashes are unique" "$OUT" "uq_password_reset_hash"
OUT=$(rins "NOT-HEX" || true); expect_has "reset token hash must be 64 lower-case hex" "$OUT" "ck_password_reset_hash"
OUT=$(q pr-insert id="$(cat /proc/sys/kernel/random/uuid)" userId="$U1" tokenHash="$R3" createdAt=2026-02-01T01:00:00Z expiresAt=2026-02-01T00:30:00Z || true)
expect_has "reset expiry must be after creation" "$OUT" "ck_password_reset_expiry"
PR1=$(q pr-find tokenHash="$R1"); PID1=$(cut -d'|' -f1 <<<"$PR1")
expect_eq "pr-find returns the owner and an unused token" "$(cut -d'|' -f2,6 <<<"$PR1")" "$U1|"
expect_eq "unknown reset hash finds nothing" "$(q pr-find tokenHash="$R3")" ""
expect_eq "an expired token cannot be consumed" "$(count pr-mark-used at=2026-02-01T00:30:01Z id="$PID1")" "0"
expect_eq "a live token is consumed once" "$(count pr-mark-used at=2026-02-01T00:10:00Z id="$PID1")" "1"
expect_eq "consuming it again changes nothing" "$(count pr-mark-used at=2026-02-01T00:11:00Z id="$PID1")" "0"
PID2=$(q pr-find tokenHash="$R2" | cut -d'|' -f1)
for i in 1 2 3 4 5 6 7 8; do count pr-mark-used at=2026-02-01T00:10:00Z id="$PID2" > "$WORK/prace$i" & done; wait
expect_eq "8 concurrent resets: exactly one wins" "$(cat "$WORK"/prace* | grep -c '^1$' || true)" "1"
rins "$R3" >/dev/null
expect_eq "invalidate-user voids only the still-unused tokens" "$(count pr-invalidate-user at=2026-02-01T00:12:00Z userId="$U1")" "1"
expect_eq "voided token can no longer be consumed" "$(count pr-mark-used at=2026-02-01T00:13:00Z id="$(q pr-find tokenHash="$R3" | cut -d'|' -f1)")" "0"

"${psql_base[@]}" -d algovision -c "DELETE FROM users WHERE id='$U1'"
expect_eq "deleting the user cascades to their tokens" "$("${psql_base[@]}" -d algovision -t -A -c "SELECT (SELECT count(*) FROM refresh_tokens)+(SELECT count(*) FROM password_reset_tokens)")" "0"

echo "$PASS passed, $FAILN failed"
[ "$FAILN" = 0 ]
