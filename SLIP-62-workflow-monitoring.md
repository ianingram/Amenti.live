### 62 · YML WORKFLOW MONITORING — the automation has no intent register
Raised 4 Sep, after a hand audit of the automation got it wrong in the most
ordinary way. Five workflow files were read, the correction was found in all
five, and the session reported **"five of five carry the correction."** There
are at least eight. **Three of them carried a bare `git push`** —
`atlantica-dispatch`, `librarian`, and `cite-a-room`, which rebases twice and
still pushes bare. Nobody had a list, so nobody could audit what nothing mapped.
This is BRIEF-NOTHING-MAPS-THE-SURFACES in a third place.

**WHAT WAS BUILT (done, on main):**
- `probes/probe-workflows.mjs` — reads `.github/workflows` **as a directory**,
  so it sees every file including the ones nobody thought to name. Writes
  `WORKFLOWS.json`. Guards three faults: a bare push; **a rebase with no
  retry** (the half-correction, and the more dangerous shape because it
  survives the ordinary case and only dies under load — `stamp.yml` had
  exactly this); and two workflows on one cron rung, a rule that until now
  lived only in a COMMENT inside `hall.yml`, and a comment cannot check
  anything.
- `.github/workflows/audit.yml` — runs probe-workflows, probe-map and
  probe-geo at **:32 past every sixth hour**, a rung the register confirms is
  free. Commits first, gates last, one gate per probe: an alarm that aborts
  before the commit throws away its own evidence.
- All eight known workflows now rebase and retry. The probe reports clean
  against main.

**WHAT IS NOT DONE, AND IS THE ACTUAL MOVE:**

`watch.html` was built the same night and **must not go through the Glass
Gate as it stands.** It reads `WORKFLOWS.json`, `GEO.json` and
`ROSTER-INDEX.json` and states what it finds. It shows the empty glass rather
than a cached number, which is the one requirement of `probe18` it meets. It
fails the rest, and the reason is the whole point of the gate:

> **The Glass Gate** — the three-source architecture. Structure *generated*,
> semantics *authored*, live state *probed*, merged with a drift report.

`watch.html` has ONE source. It is probed state with no authored layer, and
therefore **no drift report** — which is the only thing that makes a monitor
worth reading. `fleet-status.html` is the template and already does it right:
`fleet.json` is intent, `fleet-dispatch.json` is reality, and the verdict is
the difference. That is what lets it say *paused and quiet is calm, LIVE and
never fired is a fault* — a distinction `watch.html` structurally cannot make.

**THE BLINDNESS THIS LEAVES.** If `librarian.yml` were deleted tomorrow,
`watch.html` would show seven workflows, all green, and nothing would say one
had gone. That is precisely what `probe18` was written about:
*it was not lying — it was still showing the last thing it saw, forever.*

**THE MOVE:**
- Author `workflows-intent.json` — which workflows are MEANT to exist, which
  are meant to commit, which rung each holds, and which are paused or planned
  by intent. Authored, not generated: nothing in it may be derivable by a
  grep, or `probe18`'s first test fails it.
- Lay `WORKFLOWS.json` (probed) against it and state the drift: a workflow
  that vanished, one that gained a commit step it was not meant to have, one
  that took a rung.
- Then, and only then, `watch.html` goes through the gate — or better, becomes
  a section of `fleet-status.html`, which already holds the captain's-window
  job. **Two monitoring surfaces will drift, and then there are two answers
  about the ship's health with nothing to say which is real** — the fault
  `amenti-hall.js` names in its own opening lines: *two roster loaders, two
  engines, a name changed on a wrong inference.*

**WHY IT MATTERS BEYOND THE WORKFLOWS.** Twenty-two panes, a dozen workflows,
224 documents, 2,043 souls. The ship passed what a person can hold in their
head some time ago, and the 4 Sep audit is what that looks like from the
inside: a careful reading, honestly reported, and wrong. Every register exists
because of a moment like it.

- **Acceptance test:** `workflows-intent.json` exists and is authored;
  `probe-workflows.mjs --check` fails when a workflow named in the intent is
  absent from disk; and deleting a workflow file turns the monitor RED rather
  than showing one fewer row in green.
