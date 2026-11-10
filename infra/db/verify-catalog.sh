#!/usr/bin/env bash
# Runs the exact SQL files used by the catalog and learning JDBC stores (apps/api/src/main/resources/sql/{catalog,learning})
# against a throwaway PostgreSQL 16 built from the Flyway migrations (versioned, then the repeatable catalog sync).
# Usage: infra/db/verify-catalog.sh [pg-bin-dir]
set -euo pipefail
BIN="${1:-/usr/lib/postgresql/16/bin}"
HERE="$(cd "$(dirname "$0")" && pwd)"
MIG="$HERE/../../apps/api/src/main/resources/db/migration"
SQLROOT="$HERE/../../apps/api/src/main/resources/sql"
WORK="$(mktemp -d)"; PORT=54332
chmod 755 "$WORK"
run_pg() { if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$@"; else "$@"; fi; }
[ "$(id -u)" = 0 ] && chown postgres "$WORK"
trap 'run_pg "$BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT
run_pg "$BIN/initdb" -D "$WORK/data" -A trust -U postgres >/dev/null
run_pg "$BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -w -l "$WORK/log" start >/dev/null
P=(psql -h "$WORK" -p "$PORT" -U postgres -q)
"${P[@]}" -c "CREATE DATABASE algovision" >/dev/null
for f in $(ls "$MIG"/V*.sql | sort -V); do "${P[@]}" -v ON_ERROR_STOP=1 -d algovision -f "$f" >/dev/null; done
"${P[@]}" -v ON_ERROR_STOP=1 -d algovision -f "$MIG/R__catalog_sync.sql" >/dev/null

PASS=0; FAILN=0
ok() { PASS=$((PASS+1)); echo "PASS  $1"; }
bad() { FAILN=$((FAILN+1)); echo "FAIL  $1  -> $2"; }
sql() { "${P[@]}" -d algovision -t -A -v ON_ERROR_STOP=1 -c "$1" 2>&1; }
# q <dir/file> name=value ...  (values become quoted psql literals; stdin so :name is substituted)
q() { local f="$1"; shift; local a=(); for kv in "$@"; do a+=(-v "${kv%%=*}='${kv#*=}'"); done
      "${P[@]}" -d algovision -t -A -v ON_ERROR_STOP=1 "${a[@]}" < "$SQLROOT/$f.sql" 2>&1; }
eq() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1" "expected '$3' got '$2'"; fi; }
has() { if grep -q -- "$3" <<<"$2"; then ok "$1"; else bad "$1" "expected to contain '$3' got '$2'"; fi; }

# ---- content sync -------------------------------------------------------------------------------------------
eq "sync publishes all 109 algorithms" "$(sql "SELECT count(*) FROM algorithms WHERE status='PUBLISHED'")" "109"
eq "no algorithm stays DRAFT" "$(sql "SELECT count(*) FROM algorithms WHERE status<>'PUBLISHED'")" "0"
eq "every algorithm has 4 language hashes" "$(sql "SELECT count(*) FROM (SELECT algorithm_id FROM algorithm_languages GROUP BY 1 HAVING count(*)=4) s")" "109"
eq "language hashes are real sha256 (436 rows; C and C++ share identical source for some algorithms, so 413 distinct)" "$(sql "SELECT count(DISTINCT content_hash) FROM algorithm_languages")" "413"
eq "one version row per algorithm after first sync" "$(sql "SELECT count(*)||'/'||min(version)||'/'||max(version) FROM algorithm_versions")" "109/1/1"
"${P[@]}" -v ON_ERROR_STOP=1 -d algovision -f "$MIG/R__catalog_sync.sql" >/dev/null
eq "re-running the sync is idempotent (no new versions, no duplicates)" "$(sql "SELECT (SELECT count(*) FROM algorithm_versions)||'/'||(SELECT count(*) FROM algorithms)||'/'||(SELECT count(*) FROM topics)||'/'||(SELECT count(*) FROM categories)")" "109/109/16/16"
eq "the V6 starter row was upgraded in place, not duplicated" "$(sql "SELECT count(*) FROM algorithms WHERE slug='linked-list-insert-head'")" "1"
# simulate edited content: change one source hash in a temp copy, expect exactly one new version and a new language hash
H=$(sql "SELECT content_hash FROM algorithm_languages al JOIN algorithms a ON a.id=al.algorithm_id WHERE a.slug='linear-search' AND language_code='java'")
NEW=$(printf 'f%.0s' $(seq 64))
sed "s/$H/$NEW/g" "$MIG/R__catalog_sync.sql" > "$WORK/changed.sql"
VH=$(sql "SELECT content_hash FROM algorithm_versions v JOIN algorithms a ON a.id=v.algorithm_id WHERE a.slug='linear-search'")
sed -i "s/$VH/$(printf 'e%.0s' $(seq 64))/g" "$WORK/changed.sql"
"${P[@]}" -v ON_ERROR_STOP=1 -d algovision -f "$WORK/changed.sql" >/dev/null
eq "changed content appends version 2 for that algorithm only" "$(sql "SELECT string_agg(a.slug||':'||v.version, ',' ORDER BY a.slug, v.version) FROM algorithm_versions v JOIN algorithms a ON a.id=v.algorithm_id WHERE a.slug='linear-search'")" "linear-search:1,linear-search:2"
eq "the other 108 algorithms still have exactly one version" "$(sql "SELECT count(*) FROM algorithm_versions v JOIN algorithms a ON a.id=v.algorithm_id WHERE a.slug<>'linear-search'")" "108"
eq "changed language hash was stored" "$(sql "SELECT content_hash FROM algorithm_languages al JOIN algorithms a ON a.id=al.algorithm_id WHERE a.slug='linear-search' AND language_code='java'")" "$NEW"

# ---- catalog reads ------------------------------------------------------------------------------------------
eq "list-categories returns 16 published categories in order" "$(q catalog/list-categories | cut -d'|' -f1 | paste -sd,)" "arrays,two-pointers,sliding-window,linked-lists,searching,sorting,stacks-and-queues,hashing,trees,recursion,dynamic-programming,graphs,backtracking,greedy,math,bit-manipulation"
eq "category counts add up to 109" "$(q catalog/list-categories | awk -F'|' '{s+=$4} END{print s}')" "109"
eq "list-algorithms returns 109 rows" "$(q catalog/list-algorithms | wc -l | tr -d ' ')" "109"
eq "list-algorithms is grouped by category order (first is the first Arrays algorithm)" "$(q catalog/list-algorithms | head -1 | cut -d'|' -f1)" "best-time-to-buy-sell-stock"
eq "find-algorithm returns latest version hash" "$(q catalog/find-algorithm slug=linear-search | cut -d'|' -f15)" "$(sql "SELECT content_hash FROM algorithm_versions v JOIN algorithms a ON a.id=v.algorithm_id WHERE a.slug='linear-search' AND version=2")"
eq "find-algorithm: unknown slug returns nothing" "$(q catalog/find-algorithm slug=nope)" ""
sql "UPDATE algorithms SET status='DRAFT' WHERE slug='bubble-sort'" >/dev/null
eq "draft algorithms are hidden from find" "$(q catalog/find-algorithm slug=bubble-sort)" ""
eq "draft algorithms are hidden from the list" "$(q catalog/list-algorithms | grep -c bubble-sort || true)" "0"
sql "UPDATE algorithms SET status='PUBLISHED' WHERE slug='bubble-sort'" >/dev/null
eq "algorithm-languages lists java,python,cpp,c in order" "$(q catalog/algorithm-languages slug=binary-search | cut -d'|' -f1 | paste -sd,)" "java,python,cpp,c"
sql "UPDATE programming_languages SET enabled=false WHERE code='c'" >/dev/null
eq "disabled languages are hidden" "$(q catalog/algorithm-languages slug=binary-search | cut -d'|' -f1 | paste -sd,)" "java,python,cpp"
eq "enabled-languages follows the flag" "$(q catalog/enabled-languages | paste -sd,)" "java,python,cpp"
sql "UPDATE programming_languages SET enabled=true WHERE code='c'" >/dev/null

# ---- learning -----------------------------------------------------------------------------------------------
U=$(sql "INSERT INTO users (email, password_hash, full_name) VALUES ('a@example.com','x','Ada') RETURNING id" | head -1)
T1=2026-01-01T10:00:00Z; T2=2026-01-02T10:00:00Z; T3=2026-01-03T10:00:00Z
eq "record-view creates progress" "$(q learning/record-view userId="$U" slug=linear-search language=java at=$T1 | head -1 | grep -c '^[0-9]')" "1"
q learning/record-view userId="$U" slug=linear-search language= at=$T2 >/dev/null
eq "second view updates the same row" "$(sql "SELECT count(*) FROM user_progress")" "1"
eq "an empty language keeps the previous one" "$(sql "SELECT last_language_code FROM user_progress")" "java"
eq "first_viewed_at is kept, last_viewed_at advances" "$(sql "SELECT (first_viewed_at='$T1' AND last_viewed_at='$T2') FROM user_progress")" "t"
q learning/record-view userId="$U" slug=linear-search language=python at=$T1 >/dev/null
eq "an out-of-order older view never moves last_viewed_at back" "$(sql "SELECT last_viewed_at='$T2' FROM user_progress")" "t"
eq "record-view for an unknown slug inserts nothing" "$(q learning/record-view userId="$U" slug=ghost language=java at=$T1)" ""
OUT=$(q learning/record-view userId="$U" slug=linear-search language=klingon at=$T1 || true)
has "unknown language is rejected by the foreign key" "$OUT" "violates foreign key"
eq "mark-completed completes with completed_at" "$(q learning/mark-completed userId="$U" slug=linear-search language=java at=$T2 | head -1 | grep -c '^[0-9]')" "1"
q learning/mark-completed userId="$U" slug=linear-search language=java at=$T3 >/dev/null
eq "completing again keeps the first completed_at" "$(sql "SELECT status||':'||(completed_at='$T2')::text FROM user_progress WHERE status='COMPLETED' ORDER BY completed_at LIMIT 1")" "COMPLETED:true"
q learning/record-view userId="$U" slug=linear-search language=java at=$T3 >/dev/null
eq "viewing a completed algorithm does not reopen it" "$(sql "SELECT status FROM user_progress")" "COMPLETED"
q learning/mark-completed userId="$U" slug=bubble-sort language=c at=$T1 >/dev/null
eq "completing an unseen algorithm creates a completed row" "$(sql "SELECT count(*) FROM user_progress WHERE status='COMPLETED'")" "2"
eq "list-progress is newest first" "$(q learning/list-progress userId="$U" | cut -d'|' -f1 | paste -sd,)" "linear-search,bubble-sort"

eq "add-bookmark inserts" "$(q learning/add-bookmark userId="$U" slug=binary-search | head -1 | grep -c '^[0-9]')" "1"
eq "add-bookmark twice is a no-op (idempotent)" "$(q learning/add-bookmark userId="$U" slug=binary-search)" ""
eq "still one bookmark row" "$(sql "SELECT count(*) FROM bookmarks")" "1"
eq "add-bookmark for unknown slug adds nothing" "$(q learning/add-bookmark userId="$U" slug=ghost)" ""
eq "list-bookmarks returns it" "$(q learning/list-bookmarks userId="$U" | cut -d'|' -f1)" "binary-search"
eq "remove-bookmark returns the removed row" "$(q learning/remove-bookmark userId="$U" slug=binary-search | head -1 | grep -c '^[0-9]')" "1"
eq "remove-bookmark twice removes nothing" "$(q learning/remove-bookmark userId="$U" slug=binary-search)" ""
eq "algorithm-exists true / false" "$(q learning/algorithm-exists slug=linear-search)/$(q learning/algorithm-exists slug=ghost)" "1/"

q learning/log-activity userId="$U" eventType=VIEWED slug=linear-search at=$T1 >/dev/null
eq "log-activity stores an event" "$(sql "SELECT event_type FROM learning_activity")" "VIEWED"
OUT=$(q learning/log-activity userId="$U" eventType=HACKED slug=linear-search at=$T1 || true)
has "unknown event type is rejected" "$OUT" "learning_activity"

eq "no preferences yet" "$(q learning/get-preferences userId="$U")" ""
q learning/put-preferences userId="$U" language=cpp theme=dark speed=1.5 >/dev/null
q learning/put-preferences userId="$U" language=python theme=light speed=2.0 >/dev/null
eq "preferences upsert replaces, one row" "$(q learning/get-preferences userId="$U")|$(sql "SELECT count(*) FROM user_preferences")" "python|light|2.0|1"
OUT=$(q learning/put-preferences userId="$U" language=cpp theme=neon speed=1.0 || true)
has "invalid theme rejected" "$OUT" "user_preferences"
OUT=$(q learning/put-preferences userId="$U" language=cpp theme=dark speed=3.0 || true)
has "invalid speed rejected" "$OUT" "user_preferences"
eq "empty language stores NULL" "$(q learning/put-preferences userId="$U" language= theme=dark speed=1.0 >/dev/null; sql "SELECT language_code IS NULL FROM user_preferences")" "t"

echo; echo "catalog verification: $PASS passed, $FAILN failed"
[ "$FAILN" = 0 ]
