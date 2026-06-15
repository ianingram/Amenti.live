/*
 * Atlantica — dispatch generator (v1)
 * --------------------------------------------------------------------------
 * Picks one sourced figure who does not yet have a dispatch, loads that
 * figure's own primary-source passages from their reading room, asks the
 * Anthropic API to write a ~290-word first-person reflection grounded in
 * those passages, and appends it to atlantica.json (the sourced[] array).
 *
 * Run by .github/workflows/atlantica-dispatch.yml. Env:
 *   ANTHROPIC_API_KEY  required (unless DRY_RUN)   - your API key (repo secret)
 *   FIGURE_KEY         optional                    - force a specific figure
 *   ATLANTICA_MODEL    optional (default sonnet)   - model id your key can use
 *   DRY_RUN            optional ("1")              - skip the API, write a stub
 *
 * v1 only fills figures that have a reading room AND no dispatch yet. It never
 * overwrites an existing dispatch and never touches personae[]/dispatches[].
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ATL_PATH = path.join(ROOT, 'atlantica.json');
const FIGURES = require(path.join(__dirname, 'atlantica-figures.json'));
const MODEL = process.env.ATLANTICA_MODEL || 'claude-sonnet-4-6';
const DRY_RUN = !!process.env.DRY_RUN;

function yearLabel(y) {
  if (y == null) return '';
  return y < 0 ? Math.abs(y) + ' BCE' : y + ' CE';
}

// Gather the figure's own words: every "stored" work's .md body that exists.
function loadSource(key) {
  const catPath = path.join(ROOT, 'library', key + '.json');
  if (!fs.existsSync(catPath)) return '';
  const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  const passages = [];
  for (const w of (cat.works || [])) {
    if (w.mode !== 'stored' || !w.file) continue;
    const fp = path.join(ROOT, 'library', w.file);
    if (!fs.existsSync(fp)) continue; // un-uploaded / external files skipped
    passages.push('## ' + (w.title || '') + '\n' + fs.readFileSync(fp, 'utf8').trim());
  }
  return passages.join('\n\n');
}

function buildPrompts(fig, source) {
  const system =
`You are writing a single dispatch for "Atlantica", a daily series of short reflections by historical figures, each speaking in the first person about an idea from their own primary source.

Write AS ${fig.name}. Reflect on a real, specific idea drawn from the passages of your own work given below — echo or paraphrase a genuine point from them, in your authentic cadence. Then carry that idea into the reader's present day with a sharp, illuminating turn. End on a resonant line.

Hard rules:
- 280-300 words. First person throughout.
- Ground every claim in the actual passages. Do not invent facts about your life or work.
- No headings, no lists, no preamble. Plain prose; occasional *italic* emphasis is fine.
- Never mention being an AI, a model, a blog, or "Atlantica".

Return ONLY a JSON object, no markdown fences, no other text:
{"title": "<short evocative title, 2-5 words>", "body": "<the dispatch>"}`;

  const user =
`The work you are reflecting on: ${fig.eventTitle} (${yearLabel(fig.eventYear)}).

Passages from your own writing:

${source.slice(0, 12000)}`;

  return { system, user };
}

async function generate(fig, source) {
  if (DRY_RUN) {
    const flat = source.replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim();
    return { title: 'Dry run — ' + fig.name, body: flat.slice(0, 1200) + ' …' };
  }
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  const { system, user } = buildPrompts(fig, source);
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: user }],
  });
  let raw = (res.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  let out;
  try { out = JSON.parse(raw); }
  catch (e) { throw new Error('Model did not return valid JSON:\n' + raw.slice(0, 400)); }
  if (!out.title || !out.body) throw new Error('Model response missing title or body.');
  return { title: String(out.title).trim(), body: String(out.body).trim() };
}

(async () => {
  const atl = JSON.parse(fs.readFileSync(ATL_PATH, 'utf8'));
  atl.sourced = Array.isArray(atl.sourced) ? atl.sourced : [];
  const have = new Set(atl.sourced.map(s => s.figureKey));

  const override = (process.env.FIGURE_KEY || '').trim();
  let fig;
  if (override) {
    fig = FIGURES.find(f => f.key === override);
    if (!fig) { console.error('Unknown figure key: ' + override); process.exit(1); }
  } else {
    fig = FIGURES.find(f => !have.has(f.key));
    if (!fig) { console.log('Every roster figure already has a dispatch — nothing to do.'); return; }
  }
  console.log('Figure: ' + fig.name + ' (' + fig.key + ')' + (DRY_RUN ? '  [DRY RUN]' : ''));

  const source = loadSource(fig.key);
  if (!source || source.length < 200) {
    console.error('No usable source passages for ' + fig.key + ' — skipping (are its .md files committed?).');
    process.exit(1);
  }

  const out = await generate(fig, source);
  const wc = out.body.split(/\s+/).filter(Boolean).length;
  console.log('Wrote "' + out.title + '" — ' + wc + ' words');

  const d = new Date();
  const ymd = '' + d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');
  let id = fig.key + '-' + ymd, n = 2;
  while (atl.sourced.some(s => s.id === id)) id = fig.key + '-' + ymd + '-' + (n++);

  atl.sourced.push({
    id, figureKey: fig.key, name: fig.name, epithet: fig.epithet,
    eventTitle: fig.eventTitle, eventYear: fig.eventYear,
    title: out.title, body: out.body,
  });
  fs.writeFileSync(ATL_PATH, JSON.stringify(atl, null, 2) + '\n');
  console.log('Appended to atlantica.json sourced[] as id "' + id + '".');
})().catch(err => { console.error(err.message || err); process.exit(1); });

