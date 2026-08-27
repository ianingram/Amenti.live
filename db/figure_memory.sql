-- ============================================================================
-- figure_memory  ·  WHAT A SOUL RECALLS OF A READER
-- ----------------------------------------------------------------------------
-- Design: BRIEF-THE-FIGURE-REMEMBERS.md, 26 August 2026.
--
-- A short list of durable facts about one signed-in reader, held by one figure.
-- Not a transcript. Three or four lines, capped, overwritten rather than
-- accumulated.
--
--   "Has an aunt, Jane"
--   "Runs a horse farm"
--
-- ── WHY IT IS SHAPED THIS WAY ───────────────────────────────────────────────
--
-- ONE ROW PER READER PER FIGURE. The primary key is the pair. This is not a
-- convenience: it is the no-leakage rule made structural. Caesar cannot learn
-- what you told Lincoln because the rows never join — there is no query that
-- returns another figure's memory, not a policy that forbids one.
--
-- FACTS AS A jsonb ARRAY OF SHORT STRINGS, not rows. The whole list is read at
-- once, written at once, and replaced at once. Overwrite semantics were chosen
-- deliberately (brief §2), and one row overwritten is simpler and safer than a
-- set of rows partially deleted. `sheet jsonb` on public.characters and
-- `sources jsonb` set the precedent for structured text in a column here.
--
-- NO POLICY. RLS is enabled and NOTHING is granted. This is the majority
-- pattern in this schema — 19 of 25 tables are service-role only, subscribers
-- among them — and it is the correct one here for a reason from the brief:
-- there is no settings page and no delete button. A reader never queries their
-- own memory, so no policy should exist that would let them. The Worker holds
-- the service key and mediates every read and write, exactly as it does for
-- every other exchange in this system.
--
-- ON DELETE CASCADE from auth.users. Closing the account is the ONLY erasure
-- (brief §6), which puts the whole weight of that promise on this line. It
-- must genuinely remove the rows, not orphan them.
--
-- ── WHAT THIS TABLE DOES NOT DO ─────────────────────────────────────────────
-- It does not store the conversation. It does not store what the figure said.
-- It has no history: a corrected fact leaves no trace of what it corrected,
-- which loses the fact that a reader moved from Denver to Portland. Accepted
-- knowingly for v1.
--
-- ── PREREQUISITE ────────────────────────────────────────────────────────────
-- SLIP 17. The Supabase restore has never been tested. From the moment this
-- table holds rows, the vault contains something that cannot be rebuilt from
-- anywhere — not from the ark, not from a repo, not from the model. Test the
-- restore BEFORE this ships, while the database still holds almost nothing.
-- ============================================================================

CREATE TABLE public.figure_memory (
    user_id     uuid NOT NULL,
    figure_key  text NOT NULL,
    facts       jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at  timestamp with time zone DEFAULT now() NOT NULL,
    created_at  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.figure_memory
    ADD CONSTRAINT figure_memory_pkey PRIMARY KEY (user_id, figure_key);

ALTER TABLE ONLY public.figure_memory
    ADD CONSTRAINT figure_memory_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- public.characters.key is the figure. A memory of a figure that does not
-- exist is a bug, and this is where it should surface rather than in a room.
ALTER TABLE ONLY public.figure_memory
    ADD CONSTRAINT figure_memory_figure_key_fkey
    FOREIGN KEY (figure_key) REFERENCES public.characters(key) ON DELETE CASCADE;

-- The cap lives here, not only in the writer. A prompt that decides to keep
-- twenty facts is a prompt that changed; the database should refuse it anyway.
-- Ten is the brief's figure (§2): a figure reciting twenty things about you is
-- unsettling.
ALTER TABLE ONLY public.figure_memory
    ADD CONSTRAINT figure_memory_facts_shape CHECK (
        jsonb_typeof(facts) = 'array'
        AND jsonb_array_length(facts) <= 10
    );

ALTER TABLE public.figure_memory ENABLE ROW LEVEL SECURITY;

-- No policy. Deliberate. See the header.

COMMENT ON TABLE public.figure_memory IS
  'What one figure recalls of one signed-in reader: a short list of durable facts, overwritten not accumulated. Service-role only by design — see BRIEF-THE-FIGURE-REMEMBERS.md.';
