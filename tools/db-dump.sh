#!/usr/bin/env bash
#
# tools/db-dump.sh — THE THIRD TIER, MADE LEGIBLE
#
# Dumps the Supabase schema to plain text, checks it for secrets, and writes a
# register of what it found. Schema only. No rows ever leave the provider.
#
# USAGE
#   export SUPABASE_DB_URL='postgresql://...'      # from the Supabase dashboard
#   bash tools/db-dump.sh
#
# The connection string is read from the environment and is never written to
# any file this script produces. Do not paste it into a chat.
#
# WRITES
#   db/schema.sql   the schema as CREATE statements — commit this
#   db/SCHEMA.json  the register: counts, schemas, and the state of the dump
#
# EXIT CODES
#   0  dump succeeded and passed the secret scan
#   1  a precondition failed — nothing was written
#   2  the dump ran but the secret scan flagged something — REVIEW BEFORE COMMIT
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/db"
OUT_SQL="$OUT_DIR/schema.sql"
OUT_JSON="$OUT_DIR/SCHEMA.json"
TMP_SQL="$(mktemp)"
trap 'rm -f "$TMP_SQL"' EXIT

# Schemas to capture. public is the application's own. Add here if the reading
# in step 1 shows the application owns others.
SCHEMAS="${SCHEMAS:-public}"

say()  { printf '%s\n' "$*"; }

# A register must never show the last good reading when this run did not read.
# Empty glass: if the dump failed, the register says so.
mark_failed() {
  mkdir -p "$OUT_DIR" 2>/dev/null || return 0
  cat > "$OUT_JSON" <<JSON
{
  "_": "Written by tools/db-dump.sh. THIS RUN DID NOT PRODUCE A READING.",
  "generated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "state": "FAILED",
  "reason": "$1",
  "counts": null,
  "_law": "A surface states nothing it did not read. The counts are null because nobody looked."
}
JSON
}

fail() { printf 'STOP: %s\n' "$*" >&2; exit 1; }

say "── the third tier ─────────────────────────────────────────"

# ── 1. preconditions ───────────────────────────────────────────
[ -n "${SUPABASE_DB_URL:-}" ] || fail "SUPABASE_DB_URL is not set.
       Supabase dashboard → Project Settings → Database → Connection string.
       Use the session-pooler or direct URI. Export it, do not paste it in chat."

# Do not trust PATH to hand over the right binary.
#
# Read on 23 Aug, from the .deb and from pg_wrapper's source:
#   · postgresql-client-N installs pg_dump ONLY to /usr/lib/postgresql/N/bin
#   · /usr/bin/pg_dump is a symlink to pg_wrapper, which picks the newest
#     installed version when none is given
#   · and yet `pg_dump --version` on a GitHub runner with 16 and 17 both
#     installed reported 16 — so something ahead of /usr/bin answered first.
#
# The cause of that precedence was never established. This resolves the
# binary by looking on disk instead, which does not depend on knowing it.
resolve_pg_dump() {
  local newest="" v
  for d in /usr/lib/postgresql/*/bin /opt/homebrew/opt/libpq/bin \
           /usr/local/opt/libpq/bin /Library/PostgreSQL/*/bin; do
    [ -x "$d/pg_dump" ] || continue
    v=$("$d/pg_dump" --version 2>/dev/null | grep -oE '[0-9]+' | head -1)
    [ -n "$v" ] || continue
    if [ -z "$newest" ] || [ "$v" -gt "$newest" ]; then
      newest="$v"; PGDUMP="$d/pg_dump"
    fi
  done
  # Only fall back to PATH if nothing was found on disk.
  [ -n "${PGDUMP:-}" ] || PGDUMP=$(command -v pg_dump 2>/dev/null)
}

TOOL=""
PGDUMP=""
if command -v supabase >/dev/null 2>&1; then
  TOOL="supabase"
else
  resolve_pg_dump
  [ -n "$PGDUMP" ] || fail "neither the supabase CLI nor any pg_dump was found.
       supabase CLI:  https://supabase.com/docs/guides/local-development
       or pg_dump:    apt install postgresql-client-17  /  brew install libpq
       Looked in /usr/lib/postgresql/*/bin and on PATH."
  TOOL="pg_dump"
  say "tool          $PGDUMP"
  say "              $("$PGDUMP" --version)"
fi
[ "$TOOL" = "supabase" ] && say "tool          supabase CLI"
say "schemas       $SCHEMAS"

# ── 2. the dump ────────────────────────────────────────────────
say "dumping       schema only, no data …"

if [ "$TOOL" = "supabase" ]; then
  supabase db dump --db-url "$SUPABASE_DB_URL" -f "$TMP_SQL" 2>&1 | sed 's/^/              /'
  RC=${PIPESTATUS[0]}
else
  SCHEMA_ARGS=""
  for s in $SCHEMAS; do SCHEMA_ARGS="$SCHEMA_ARGS --schema=$s"; done
  # shellcheck disable=SC2086
  "$PGDUMP" "$SUPABASE_DB_URL" \
    --schema-only --no-owner --no-privileges --no-comments \
    $SCHEMA_ARGS > "$TMP_SQL" 2> >(sed 's/^/              /' >&2)
  RC=$?
fi

if [ "$RC" -ne 0 ]; then
  mark_failed "dump exited $RC"
  fail "the dump failed (exit $RC). Nothing was written.
       A server version mismatch means the newest pg_dump on this machine is
       older than the server. Install postgresql-client matching the server."
fi

if [ ! -s "$TMP_SQL" ]; then mark_failed "dump was empty"; fi
[ -s "$TMP_SQL" ] || fail "the dump produced an empty file. Nothing was written.
       An empty dump is not an empty database — treat it as a failed reading."

BYTES=$(wc -c < "$TMP_SQL" | tr -d ' ')
say "dumped        $BYTES bytes"

# ── 3. the secret scan — before anything reaches the repo ──────
say "scanning      for credentials …"
HITS=$(grep -nEi \
  "(postgres(ql)?://[^ ]*:[^ ]*@|PASSWORD[[:space:]]+'|service_role|eyJ[A-Za-z0-9_-]{20,}|sk_live_|SUPABASE_[A-Z_]*KEY)" \
  "$TMP_SQL" | head -20)

SCAN="clean"
if [ -n "$HITS" ]; then
  SCAN="FLAGGED"
  say ""
  say "  !! the scan flagged these lines. READ THEM BEFORE COMMITTING:"
  printf '%s\n' "$HITS" | sed 's/^/     /'
  say ""
fi

# ── 4. the reading — what is actually in there ─────────────────
count() { grep -cE "$1" "$TMP_SQL" | tr -d ' '; }
TABLES=$(count '^CREATE TABLE')
VIEWS=$(count '^CREATE( OR REPLACE)? VIEW|^CREATE MATERIALIZED VIEW')
FUNCS=$(count '^CREATE( OR REPLACE)? FUNCTION')
POLICIES=$(count '^CREATE POLICY')
TRIGGERS=$(count '^CREATE TRIGGER')
RLS=$(count 'ENABLE ROW LEVEL SECURITY')
FOUND_SCHEMAS=$(grep -oE '^CREATE SCHEMA (IF NOT EXISTS )?[a-zA-Z0-9_]+' "$TMP_SQL" \
  | awk '{print $NF}' | sort -u | paste -sd' ' -)

say ""
say "  tables        $TABLES"
say "  views         $VIEWS"
say "  functions     $FUNCS"
say "  policies      $POLICIES     (rls enabled on $RLS)"
say "  triggers      $TRIGGERS"
say ""

# The question this whole thing started from.
if grep -qE '^CREATE TABLE[^;]*\brig_views\b' "$TMP_SQL"; then
  say "  rig_views     PRESENT"
else
  say "  rig_views     not in this dump"
fi

# A table with no policy is readable by anyone holding the anon key.
UNPROTECTED=$(grep -oE '^CREATE TABLE (IF NOT EXISTS )?[a-zA-Z0-9_."]+' "$TMP_SQL" \
  | awk '{print $NF}' | tr -d '"' | awk -F. '{print $NF}' | sort -u \
  | while read -r t; do
      [ -n "$t" ] || continue
      grep -qE "ENABLE ROW LEVEL SECURITY[^;]*\b$t\b|ALTER TABLE[^;]*\b$t\b[^;]*ROW LEVEL SECURITY" "$TMP_SQL" || printf '%s ' "$t"
    done)
if [ -n "$UNPROTECTED" ]; then
  say "  NO RLS ON:    $UNPROTECTED"
  say "                a table with no policy is open to anyone with the anon key."
  say ""
fi

# ── 5. write ───────────────────────────────────────────────────
mkdir -p "$OUT_DIR"

if [ -f "$OUT_SQL" ] && diff -q "$OUT_SQL" "$TMP_SQL" >/dev/null 2>&1; then
  DRIFT="none"
  say "drift         none since last dump"
else
  DRIFT=$([ -f "$OUT_SQL" ] && echo "CHANGED" || echo "first dump")
  say "drift         $DRIFT"
fi

[ "$SCAN" = "clean" ] && cp "$TMP_SQL" "$OUT_SQL"

cat > "$OUT_JSON" <<JSON
{
  "_": "The third tier, read. Written by tools/db-dump.sh. A register is a reading, not a memory — regenerate it, never edit it.",
  "generated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "tool": "${PGDUMP:-$TOOL}",
  "schemas_requested": "$SCHEMAS",
  "schemas_found": "$FOUND_SCHEMAS",
  "dump": {
    "path": "$([ "$SCAN" = clean ] && echo db/schema.sql || echo db/schema.sql.REVIEW)",
    "bytes": $BYTES,
    "drift_since_last": "$DRIFT"
  },
  "counts": {
    "tables": $TABLES,
    "views": $VIEWS,
    "functions": $FUNCS,
    "policies": $POLICIES,
    "rls_enabled": $RLS,
    "triggers": $TRIGGERS
  },
  "rig_views": "$(grep -qE '^CREATE TABLE[^;]*\brig_views\b' "$TMP_SQL" && echo present || echo absent)",
  "tables_without_rls": "$(echo "$UNPROTECTED" | sed 's/ *$//')",
  "secret_scan": "$SCAN",
  "_law": "Schema only. No rows are dumped. The rows are the provider's to keep; the definitions are ours to hold."
}
JSON

if command -v node >/dev/null 2>&1; then
  node -e "JSON.parse(require('fs').readFileSync('$OUT_JSON','utf8'))" \
    && say "json          valid" \
    || fail "the register is not valid JSON. Fix db-dump.sh before committing."
fi


# A flagged dump must not land on the committable path. `git add db/` is one
# keystroke, and a secret in a repo is not retracted by deleting it later.
if [ "$SCAN" = "FLAGGED" ]; then
  QUARANTINE="$OUT_DIR/schema.sql.REVIEW"
  cp "$TMP_SQL" "$QUARANTINE"
  say ""
  say "wrote         db/schema.sql.REVIEW   (quarantined — NOT the committable path)"
  say "              db/schema.sql was left untouched."
  say ""
  say "!! Read the flagged lines above. If they are false alarms, rename the file"
  say "   to db/schema.sql yourself. If they are real, the credential is in the"
  say "   database's own definitions and must be removed there, not edited out here."
  say "───────────────────────────────────────────────────────────"
  exit 2
fi


say ""
say "wrote         db/schema.sql"
say "wrote         db/SCHEMA.json"
say ""
say "next          git add db/ && git commit -m 'the third tier: schema under version control'"
say "              then verify Sunday's ark carries it. Do not assume it."
say "───────────────────────────────────────────────────────────"
