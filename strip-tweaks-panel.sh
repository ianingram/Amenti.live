#!/usr/bin/env bash
# ============================================================================
# strip-tweaks-panel.sh · remove the React/Babel "Tweaks Panel" from Page1.html
# ----------------------------------------------------------------------------
# This is the ~10-second-freeze fix. It deletes:
#   1. the 3 blocking <head> scripts (react.dev, react-dom.dev, @babel/standalone)
#   2. the <script type="text/babel"> Tweaks Panel component (the design slider box)
# It VERIFIES every safety condition and refuses to save if anything is off.
#
# RUN in your Codespace terminal, from the repo root:
#     bash strip-tweaks-panel.sh
# Then review, commit, and push.
# ============================================================================
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then echo "✗ Not in a git repo. cd into /workspaces/Amenti.live first."; exit 1; fi
cd "$ROOT"
[ -f Page1.html ] || { echo "✗ Page1.html not found here."; exit 1; }

# safety backup
cp Page1.html Page1.html.bak
echo "▸ backup saved: Page1.html.bak"

python3 - << 'PY'
import re, sys
src = open('Page1.html', encoding='utf-8').read()
orig = src

# ---- Deletion 1: the three blocking head scripts ----
removed = 0
for pat in [
    r'<script src="https://unpkg\.com/react@[^\"]*"[^>]*></script>\s*',
    r'<script src="https://unpkg\.com/react-dom@[^\"]*"[^>]*></script>\s*',
    r'<script src="https://unpkg\.com/@babel/standalone@[^\"]*"[^>]*></script>\s*',
]:
    src, n = re.subn(pat, '', src); removed += n

# ---- Deletion 2: the text/babel Tweaks Panel block ----
m = re.search(r'<script type="text/babel"[^>]*>.*?</script>\s*', src, re.S)
babel = 1 if m else 0
if m:
    src = src[:m.start()] + src[m.end():]

# ---- SAFETY GATE: bail out (no write) if anything is wrong ----
def real_body_tags(s):   # ignore </body> that appears inside a comment line
    return sum(1 for ln in s.splitlines() if '</body>' in ln and 'BEFORE the closing' not in ln)

problems = []
if removed != 3:                       problems.append(f"expected to remove 3 head scripts, removed {removed}")
if babel != 1:                         problems.append("did not find exactly one text/babel block")
if 'react.development' in src:         problems.append("react.development still present")
if 'babel.min' in src:                 problems.append("babel.min still present")
if 'text/babel' in src:                problems.append("text/babel still present")
if 'data-arena="1"' not in src:        problems.append("data-arena=1 block was destroyed")
if 'amenti-vallhalla-signup.js' not in src: problems.append("signup script vanished")
if 'amenti-auth.js' not in src:        problems.append("auth script vanished")
if real_body_tags(src) != 1:           problems.append(f"real </body> count = {real_body_tags(src)} (want 1)")
if src.count('</html>') != 1:          problems.append("</html> count wrong")
if src.count('ReactDOM') != 0:         problems.append("ReactDOM references remain")

if problems:
    print("✗ ABORTED — not saving. Problems:")
    for p in problems: print("   -", p)
    sys.exit(1)

open('Page1.html','w',encoding='utf-8').write(src)
print("✅ Page1.html cleaned.")
print(f"   removed 3 head scripts + 1 Tweaks Panel block")
print(f"   size: {len(orig):,} -> {len(src):,} bytes")
print("   all safety checks passed (data-arena=1, signup, auth intact; tags balanced)")
PY

echo
echo "▸ review the change:"
echo "    git diff --stat Page1.html"
echo "▸ if it looks right, commit + push:"
echo "    git add Page1.html && git commit -m 'Remove React/Babel Tweaks Panel (fixes main-thread freeze)' && git push"
echo "▸ if anything is wrong, restore instantly:"
echo "    mv Page1.html.bak Page1.html"
echo
echo "(Then reload the live site — sign-in, tabs, and typing should be instant.)"
