#!/usr/bin/env node
/* ============================================================================
   probes/probe-workflows.mjs  ·  THE WORKFLOW REGISTER
   ----------------------------------------------------------------------------
     node probes/probe-workflows.mjs .            # write WORKFLOWS.json
     node probes/probe-workflows.mjs . --check    # report only, exit 1 on a finding

   ── WHY THIS EXISTS ───────────────────────────────────────────────────────
   BRIEF-NOTHING-MAPS-THE-SURFACES, 27 Aug: every register on this ship maps
   the machinery, and nothing mapped the places a person can BE. This is the
   same gap in a second place. NOTHING MAPS THE WORKFLOWS.

   The cost was paid on 4 Sep. An audit of the automation was run by hand, five
   files were read, and the result was reported as "five of five carry the
   correction." There were more than five. THREE OF THEM CARRIED A BARE PUSH —
   atlantica-dispatch, librarian, and cite-a-room, which rebases twice and
   still pushes bare. A hand audit can only see the files someone thought to
   name, and nobody had a list.

   ── THE THREE FAULTS IT WATCHES ───────────────────────────────────────────

   1 · A BARE PUSH. `git push` with no rebase is correct in isolation and wrong
       the moment anything else writes to the branch — which on this repo is
       routine: a dozen workflows and a human all commit to main. flagship.yml
       went red on 4 Sep with "! [rejected] main -> main" after an upload
       landed mid-job. THE MEASUREMENT WAS FINE AND WAS THROWN AWAY.

   2 · A REBASE WITH NO RETRY. The half-correction, and the more dangerous
       shape because it survives the ordinary case and only dies under load.
       The remote can move in the seconds between the rebase and the push.
       stamp.yml had exactly this, and stamp.yml is the one a human runs right
       after an upload — the busiest moment there is.

   3 · TWO WORKFLOWS ON ONE CRON RUNG. hall.yml records the taken rungs in a
       COMMENT: ":07 :17 :27 :37 :47 (the strands), :52 (the third tier), :22
       (the source index), :42 (the hall)". A comment cannot check anything. Two
       jobs on one minute is the collision that produces fault 1.

   THIS WRITES NOTHING BUT WORKFLOWS.json. It is a reading.
   ========================================================================== */
import fs from 'fs';
import path from 'path';

const ROOT  = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const DIR   = path.join(ROOT, '.github', 'workflows');
const OUT   = path.join(ROOT, 'WORKFLOWS.json');
const CHECK = process.argv.includes('--check');
const die = m => { console.error('REFUSES: ' + m); process.exit(2); };

if (!fs.existsSync(DIR)) die('no .github/workflows at ' + path.resolve(DIR));
const files = fs.readdirSync(DIR).filter(f => /\.ya?ml$/.test(f)).sort();
if (!files.length) die('no workflow files. An empty directory is not an empty fleet — treat it as a failed reading.');

const findings = [];
const rungs = {};
const rows = [];

for (const f of files) {
  const t = fs.readFileSync(path.join(DIR, f), 'utf8');
  const lines = t.split('\n');

  const name = (/^name:\s*(.+)$/m.exec(t) || [, f])[1].trim();

  /* Triggers. `push:` inside `on:` is a trigger; `git push` in a run step is
     not — so match the YAML key at indent, never the word anywhere. */
  const on = [];
  if (/^\s{0,2}schedule:/m.test(t))          on.push('schedule');
  if (/^\s{0,2}workflow_dispatch:/m.test(t)) on.push('dispatch');
  if (/^\s{0,2}push:/m.test(t))              on.push('push');
  if (/^\s{0,2}pull_request:/m.test(t))      on.push('pull_request');

  const crons = [...t.matchAll(/cron:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  crons.forEach(c => {
    /* FOUND BY RUNNING IT, 4 Sep: keying on the MINUTE alone reported
       "0 11 * * *" and "0 6 * * *" as a collision. They share a minute and
       never share an hour — they cannot coincide. A guard that fires on
       correct data teaches the reader to stop opening the report, which is
       the lesson probe-roster.mjs already wrote down about long lives.

       So the rung is MINUTE + HOUR. Two entries collide only when both
       fields match, which is the case hall.yml's comment is actually about:
       the six-hourly strands all run often and must not share a minute. */
    const p2 = c.trim().split(/\s+/);
    const rung = p2[0] + ' ' + (p2[1] || '*');
    (rungs[rung] || (rungs[rung] = [])).push(f);
  });

  /* Does it write? Only a workflow that COMMITS can lose a race. */
  const commits = /git\s+commit/.test(t);
  const bare    = lines.filter(l => /^\s+git push\s*$/.test(l)).length;
  const rebase  = /pull --rebase/.test(t);
  const retry   = /for i in 1 2 3 4 5/.test(t);
  const skipci  = /\[skip ci\]/.test(t);
  const gates   = (t.match(/::error::/g) || []).length;

  rows.push({ file: f, name, on, crons, commits, bare, rebase, retry, skipci, gates });

  if (commits && bare)
    findings.push(f + ' — A BARE PUSH. It commits and pushes with no rebase; the next race loses the measurement.');
  else if (commits && rebase && !retry)
    findings.push(f + ' — rebase with NO RETRY. Survives the ordinary case, dies under load. The half-correction.');
  if (commits && !skipci)
    findings.push(f + ' — commits without [skip ci]; its own commit can re-trigger a workflow.');
}

/* two jobs on one minute */
Object.keys(rungs).sort().forEach(min => {
  if (rungs[min].length > 1)
    findings.push('cron rung "' + min + '" (minute hour) is held by ' + rungs[min].length +
                  ' workflows — ' + rungs[min].join(', ') + '. Two must never occupy one rung.');
});

console.log('── the workflow register ──────────────────────────────────');
console.log('workflows     ' + rows.length);
console.log('that commit   ' + rows.filter(r => r.commits).length);
console.log('scheduled     ' + rows.filter(r => r.on.includes('schedule')).length);
console.log('');
rows.forEach(r => {
  const flag = r.commits ? (r.bare ? '✗ BARE' : r.retry ? '· safe' : '✗ NO RETRY') : '  reads';
  console.log('  ' + flag.padEnd(11) + r.file.padEnd(28) +
              r.on.join('+').padEnd(26) + (r.crons.length ? r.crons.join(' ') : ''));
});

console.log('\ncron rungs held (minute hour): ' + Object.keys(rungs).sort().map(m => '"' + m + '"').join(' '));

if (findings.length) {
  console.log('');
  findings.forEach(x => console.log('  ✗ ' + x));
}
console.log('───────────────────────────────────────────────────────────');
console.log(findings.length ? findings.length + ' FINDING(S)' : 'no findings — every workflow that writes can survive a race');

if (CHECK) process.exit(findings.length ? 1 : 0);

fs.writeFileSync(OUT, JSON.stringify({
  _: 'GENERATED by probes/probe-workflows.mjs — do not edit. The automation, mapped. Nothing else in this repo lists it.',
  _law: 'A workflow that COMMITS must rebase AND retry. A cron rung holds one workflow. Both are checked here because a comment cannot check anything.',
  generated: new Date().toISOString(),
  generator: 'probes/probe-workflows.mjs',
  totals: { workflows: rows.length, committing: rows.filter(r => r.commits).length,
            scheduled: rows.filter(r => r.on.includes('schedule')).length,
            findings: findings.length },
  rungs, findings, workflows: rows
}, null, 1) + '\n');
console.log('wrote         ' + OUT);
