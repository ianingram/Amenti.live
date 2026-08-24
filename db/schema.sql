--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11 (Ubuntu 17.11-1.pgdg24.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: award_emeralds(uuid, integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.award_emeralds(p_user uuid, p_amount integer, p_reason text, p_reference text) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.emerald_ledger (user_id, amount, reason, reference)
  values (p_user, p_amount, p_reason, p_reference)
  on conflict (user_id, reason, reference) do nothing;

  return (select coalesce(sum(amount), 0)::bigint
          from public.emerald_ledger where user_id = p_user);
end;
$$;


--
-- Name: cast_argument_vote(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cast_argument_vote(p_voter uuid, p_argument uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_cost    int := 5;           -- ET per endorsement (keep in sync with the Worker's VOTE_COST)
  v_author  uuid;
  v_balance numeric;
begin
  -- 1. argument exists + visible
  select user_id into v_author from public.arguments where id = p_argument and status = 'visible';
  if v_author is null then
    return jsonb_build_object('ok', false, 'error', 'This argument is no longer available.');
  end if;

  -- 2. no self-endorsement
  if v_author = p_voter then
    return jsonb_build_object('ok', false, 'error', 'You cannot endorse your own argument.');
  end if;

  -- 3. contribution gate: the voter must have contributed at least one visible argument
  if not exists (select 1 from public.arguments where user_id = p_voter and status = 'visible') then
    return jsonb_build_object('ok', false, 'error', 'Write an argument of your own first to earn the right to endorse.');
  end if;

  -- 4. no double-endorsement
  if exists (select 1 from public.argument_votes where argument_id = p_argument and voter_id = p_voter) then
    return jsonb_build_object('ok', false, 'error', 'You already endorsed this one.');
  end if;

  -- 5. balance check
  select coalesce(sum(amount), 0) into v_balance from public.emerald_ledger where user_id = p_voter;
  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'error', 'Not enough Emerald Tokens to endorse (costs ' || v_cost || ').');
  end if;

  -- 6. debit (append-only negative row; unique (user_id,reason,reference) blocks a repeat)
  insert into public.emerald_ledger (user_id, amount, reason, reference)
    values (p_voter, -v_cost, 'vote_spend', 'vote:' || p_argument::text);

  -- 7. record the vote (trigger updates arguments.vote_count)
  insert into public.argument_votes (argument_id, voter_id) values (p_argument, p_voter);

  return jsonb_build_object('ok', true, 'cost', v_cost);
exception
  when unique_violation then
    -- raced with another endorsement of the same argument by this voter
    return jsonb_build_object('ok', false, 'error', 'You already endorsed this one.');
end $$;


--
-- Name: enforce_roster_cap(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_roster_cap() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  n integer;
begin
  select count(*) into n from roster_members where roster_id = new.roster_id;
  if n >= 25 then
    raise exception 'A roster holds twenty-five. Remove one to add another.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;


--
-- Name: handle_argument_report(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_argument_report() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  update public.arguments
     set report_count = report_count + 1,
         status = case when report_count + 1 >= 3 then 'hidden' else status end,
         updated_at = now()
   where id = new.argument_id;
  return null;
end $$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


--
-- Name: pool_leaderboard(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pool_leaderboard(p_limit integer DEFAULT 12) RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  with v as (
    select a.id as argument_id, a.user_id as author_id, a.topic_id, a.question_id,
           left(a.body, 400) as body, count(av.id)::int as votes
    from public.arguments a
    join public.argument_votes av on av.argument_id = a.id
    where a.status = 'visible'
      and av.voter_id <> a.user_id                 -- self-votes never count
      and av.created_at >= now() - interval '7 days'
    group by a.id, a.user_id, a.topic_id, a.question_id, a.body
  ),
  tot as (select coalesce(sum(votes), 0)::numeric as t from v)
  select jsonb_build_object(
    'ok', true,
    'total_votes', (select t from tot),
    'ranked', coalesce((
      select jsonb_agg(jsonb_build_object(
               'argument_id', argument_id, 'author_id', author_id,
               'topic_id', topic_id, 'question_id', question_id,
               'body', body, 'votes', votes))
      from (select * from v order by votes desc, argument_id limit p_limit) s
    ), '[]'::jsonb)
  );
$$;


--
-- Name: request_figure(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.request_figure(p_name text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  n integer;
begin
  insert into roster_requests (name) values (p_name)
  on conflict (name) do update
    set asks = roster_requests.asks + 1,
        last_asked_at = now()
  returning asks into n;
  return n;
end;
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: seed_roster(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.seed_roster(p_user uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  rid uuid;
  f   text;
  i   smallint := 0;
begin
  -- one seeded roster per seeker, ever
  select id into rid from rosters where user_id = p_user and seeded limit 1;
  if rid is not null then return rid; end if;

  insert into rosters (user_id, name, seeded)
  values (p_user, 'The First Twenty-Five', true)
  returning id into rid;

  for f in
    select unnest(array[
      -- the hand-built, and the ones most people arrive knowing
      'Julius Caesar', 'Abraham Lincoln', 'Cleopatra VII', 'Nikola Tesla',
      'Marcus Aurelius', 'Mahatma Gandhi', 'Miyamoto Musashi', 'Hannibal Barca',
      'Helen Keller', 'Frederick Douglass', 'Moses', 'Sun Tzu',
      -- the mythic band, so the library shows its range at once
      'Prometheus', 'Odysseus', 'Loki', 'Gilgamesh',
      -- the machine-made, complete with face and bars
      'Albert Einstein', 'Louis Pasteur', 'Johannes Gutenberg', 'Cai Lun',
      'Christopher Columbus', 'Isaac Newton',
      -- and three the library can weigh but few would think to ask for
      'Marcus Manlius Capitolinus', 'Lycurgus of Sparta', 'Ayn Rand'
    ])
  loop
    insert into roster_members (roster_id, figure, position)
    values (rid, f, i)
    on conflict do nothing;
    i := i + 1;
  end loop;

  return rid;
end;
$$;


--
-- Name: settle_argument_pool(integer, timestamp with time zone, timestamp with time zone, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.settle_argument_pool(p_pool integer, p_from timestamp with time zone, p_to timestamp with time zone, p_period text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  result jsonb;
begin
  with v as (
    select a.user_id as author, count(*)::int as votes
    from public.argument_votes av
    join public.arguments a on a.id = av.argument_id
    where av.created_at >= p_from
      and av.created_at <  p_to
      and a.status = 'visible'
      and a.user_id <> av.voter_id          -- never pay for self-endorsements
    group by a.user_id
  ),
  tot as (select coalesce(sum(votes), 0)::numeric as t from v),
  paid as (
    insert into public.emerald_ledger (user_id, amount, reason, reference)
    select v.author,
           floor(p_pool * v.votes / tot.t)::int,
           'pool_reward',
           'pool:' || p_period || ':' || v.author::text
    from v, tot
    where tot.t > 0
      and floor(p_pool * v.votes / tot.t)::int > 0
    on conflict (user_id, reason, reference) do nothing
    returning amount
  )
  select jsonb_build_object(
    'ok', true,
    'period', p_period,
    'total_votes',  (select t from tot),
    'authors_paid', (select count(*) from paid),
    'distributed',  (select coalesce(sum(amount), 0) from paid)
  ) into result;

  return result;
end $$;


--
-- Name: sync_argument_vote_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_argument_vote_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if (tg_op = 'INSERT') then
    update public.arguments set vote_count = vote_count + 1, updated_at = now() where id = new.argument_id;
  elsif (tg_op = 'DELETE') then
    update public.arguments set vote_count = greatest(0, vote_count - 1), updated_at = now() where id = old.argument_id;
  end if;
  return null;
end $$;


--
-- Name: terminal_heat(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.terminal_heat(p_days integer DEFAULT 7) RETURNS TABLE(topic text, activity bigint, emeralds numeric)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    split_part(l.reference, ':', 2)                     as topic,
    count(l.*)                                          as activity,
    coalesce(sum(greatest(l.amount, 0)), 0)             as emeralds
  from emerald_ledger l
  where l.created_at >= current_date - (p_days - 1)
    and l.reference like '%:%'
    and split_part(l.reference, ':', 2) <> ''
  group by split_part(l.reference, ':', 2)
  order by activity desc
  limit 20;
$$;


--
-- Name: terminal_series(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.terminal_series(p_days integer DEFAULT 30) RETURNS TABLE(day date, minted numeric, burned numeric, net numeric, txns bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    d::date                                             as day,
    coalesce(sum(case when l.amount > 0 then l.amount end), 0)      as minted,
    coalesce(sum(case when l.amount < 0 then -l.amount end), 0)     as burned,
    coalesce(sum(l.amount), 0)                                      as net,
    count(l.*)                                                      as txns
  from generate_series(
         (current_date - (p_days - 1)),
         current_date,
         interval '1 day'
       ) d
  left join emerald_ledger l
         on l.created_at >= d
        and l.created_at <  d + interval '1 day'
  group by d
  order by d asc;
$$;


--
-- Name: touch_topics_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_topics_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


--
-- Name: unsubscribe(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.unsubscribe(t uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
declare n integer;
begin
  update public.subscribers
     set status = 'unsubscribed'
   where unsub_token = t
     and status = 'active';
  get diagnostics n = row_count;
  return n > 0;
end;
$$;


--
-- Name: want_figure(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.want_figure(p_figure text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  n integer;
begin
  update quizzard_queue
     set wants           = wants + 1,
         first_wanted_at = coalesce(first_wanted_at, now()),
         last_wanted_at  = now(),
         updated_at      = now()
   where figure_name = p_figure
  returning wants into n;
  return n;   -- NULL when the figure is not on the roster
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: arguments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.arguments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    topic_id text NOT NULL,
    question_id text NOT NULL,
    body text NOT NULL,
    status text DEFAULT 'visible'::text NOT NULL,
    vote_count integer DEFAULT 0 NOT NULL,
    report_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT arguments_status_check CHECK ((status = ANY (ARRAY['visible'::text, 'hidden'::text, 'pending'::text, 'sealed'::text])))
);


--
-- Name: argument_feed; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.argument_feed WITH (security_invoker='true') AS
 SELECT id,
    topic_id,
    question_id,
    body,
    vote_count,
    created_at,
    user_id
   FROM public.arguments
  WHERE (status = 'visible'::text);


--
-- Name: argument_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.argument_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    argument_id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: argument_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.argument_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    argument_id uuid NOT NULL,
    voter_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bell_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bell_log (
    id bigint NOT NULL,
    period text NOT NULL,
    woke_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    trigger text DEFAULT 'cron'::text NOT NULL,
    cron_expr text,
    votes_found integer,
    sealed_count integer,
    ok boolean DEFAULT false NOT NULL,
    error text
);


--
-- Name: bell_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bell_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bell_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bell_log_id_seq OWNED BY public.bell_log.id;


--
-- Name: calendar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind text NOT NULL,
    figure text NOT NULL,
    title text NOT NULL,
    blurb text,
    month smallint NOT NULL,
    day smallint,
    end_month smallint,
    end_day smallint,
    year integer,
    source text,
    topic_id text,
    status text DEFAULT 'staged'::text NOT NULL,
    origin text DEFAULT 'engine'::text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT anniversary_needs_a_source CHECK (((kind <> 'anniversary'::text) OR ((source IS NOT NULL) AND (year IS NOT NULL) AND (day IS NOT NULL)))),
    CONSTRAINT calendar_day_check CHECK (((day >= 1) AND (day <= 31))),
    CONSTRAINT calendar_end_day_check CHECK (((end_day >= 1) AND (end_day <= 31))),
    CONSTRAINT calendar_end_month_check CHECK (((end_month >= 1) AND (end_month <= 12))),
    CONSTRAINT calendar_kind_check CHECK ((kind = ANY (ARRAY['anniversary'::text, 'occasion'::text, 'season'::text]))),
    CONSTRAINT calendar_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT dated_kinds_need_a_day CHECK (((kind = 'season'::text) OR (day IS NOT NULL))),
    CONSTRAINT season_needs_an_end CHECK (((kind <> 'season'::text) OR (end_month IS NOT NULL)))
);


--
-- Name: calendar_coverage; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.calendar_coverage AS
 SELECT count(*) AS entries,
    count(*) FILTER (WHERE (kind = 'anniversary'::text)) AS anniversaries,
    count(*) FILTER (WHERE (kind = 'occasion'::text)) AS occasions,
    count(*) FILTER (WHERE (kind = 'season'::text)) AS seasons,
    count(DISTINCT EXTRACT(week FROM make_date(2026, (month)::integer, COALESCE((day)::integer, 15)))) AS weeks_covered,
    round((((count(DISTINCT EXTRACT(week FROM make_date(2026, (month)::integer, COALESCE((day)::integer, 15)))))::numeric / 52.0) * (100)::numeric)) AS pct
   FROM public.calendar
  WHERE (status = 'live'::text);


--
-- Name: characters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.characters (
    key text NOT NULL,
    name text NOT NULL,
    sheet jsonb,
    portrait text,
    sources jsonb,
    figure text,
    status text DEFAULT 'staged'::text NOT NULL,
    origin text DEFAULT 'engine'::text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: emerald_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emerald_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    reason text NOT NULL,
    reference text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: emerald_balance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.emerald_balance WITH (security_invoker='true') AS
 SELECT user_id,
    COALESCE(sum(amount), (0)::bigint) AS balance
   FROM public.emerald_ledger
  GROUP BY user_id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    avatar_url text,
    wallet_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quizzard_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzard_queue (
    figure_name text NOT NULL,
    rank numeric,
    title text,
    mode text DEFAULT 'life'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    topic_id text,
    halt_reason text,
    note text,
    attempts smallint DEFAULT 0 NOT NULL,
    attempted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    wants integer DEFAULT 0 NOT NULL,
    first_wanted_at timestamp with time zone,
    last_wanted_at timestamp with time zone,
    band smallint DEFAULT 1 NOT NULL
);


--
-- Name: readings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.readings (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    topic_id text NOT NULL,
    read_on date NOT NULL,
    coverage numeric(4,3),
    words integer,
    mode text DEFAULT 'honor'::text NOT NULL,
    paid integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: readings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.readings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: readings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.readings_id_seq OWNED BY public.readings.id;


--
-- Name: refs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refs (
    key text NOT NULL,
    label text NOT NULL,
    kind text NOT NULL,
    description text NOT NULL,
    silhouette text,
    era text,
    region text,
    sources jsonb DEFAULT '[]'::jsonb NOT NULL,
    searched_at timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT refs_kind_ck CHECK ((kind = ANY (ARRAY['garment'::text, 'armour'::text, 'headwear'::text, 'footwear'::text, 'jewellery'::text, 'weapon'::text, 'tool'::text, 'instrument'::text, 'vessel'::text, 'document'::text, 'creature'::text, 'structure'::text, 'other'::text]))),
    CONSTRAINT refs_no_person_ck CHECK ((key !~ '(caesar|lincoln|gandhi|moses|hannibal|cleopatra|musashi|tesla|napoleon|einstein)'::text)),
    CONSTRAINT refs_status_ck CHECK ((status = ANY (ARRAY['draft'::text, 'live'::text, 'retired'::text])))
);


--
-- Name: scene_refs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scene_refs (
    scene_key text NOT NULL,
    ref_key text NOT NULL
);


--
-- Name: ref_leverage; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.ref_leverage AS
 SELECT r.key,
    r.label,
    r.kind,
    r.status,
    count(sr.scene_key) AS scenes_using
   FROM (public.refs r
     LEFT JOIN public.scene_refs sr ON ((sr.ref_key = r.key)))
  GROUP BY r.key, r.label, r.kind, r.status
  ORDER BY (count(sr.scene_key)) DESC, r.key;


--
-- Name: renderings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.renderings (
    id bigint NOT NULL,
    scene_key text NOT NULL,
    style_key text NOT NULL,
    artifact text,
    bytes integer,
    status text DEFAULT 'staged'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT renderings_status_ck CHECK ((status = ANY (ARRAY['staged'::text, 'live'::text, 'rejected'::text])))
);


--
-- Name: renderings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.renderings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: renderings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.renderings_id_seq OWNED BY public.renderings.id;


--
-- Name: rig_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rig_views (
    rig_key text NOT NULL,
    pose text DEFAULT 'standing'::text NOT NULL,
    angle_name text NOT NULL,
    yaw_deg numeric(5,1) NOT NULL,
    contour jsonb NOT NULL,
    chars integer NOT NULL,
    source text DEFAULT 'MakeHuman base.obj (CC0), posed by joint rotation'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    png_b64 text,
    body_layer text
);


--
-- Name: rigs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rigs (
    key text NOT NULL,
    proportion numeric(3,1) NOT NULL,
    register text NOT NULL,
    body_type text DEFAULT 'standard'::text NOT NULL,
    view_box text DEFAULT '0 0 320 560'::text NOT NULL,
    head_top integer DEFAULT 83 NOT NULL,
    ground integer DEFAULT 532 NOT NULL,
    stature_px integer DEFAULT 449 NOT NULL,
    head_px numeric(6,2) NOT NULL,
    landmark_pct jsonb NOT NULL,
    landmark_y jsonb NOT NULL,
    widths_hu jsonb NOT NULL,
    widths_px jsonb NOT NULL,
    joints jsonb NOT NULL,
    masses jsonb NOT NULL,
    somatotype jsonb,
    is_default boolean DEFAULT false NOT NULL,
    source text DEFAULT 'MakeHuman default.mhskel + base.obj (CC0)'::text NOT NULL,
    measured_from text DEFAULT 'amenti-rig-measured.json'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rigs_ground_ck CHECK ((ground = 532)),
    CONSTRAINT rigs_proportion_ck CHECK (((proportion >= 5.0) AND (proportion <= 10.0)))
);


--
-- Name: roster_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roster_members (
    roster_id uuid NOT NULL,
    figure text NOT NULL,
    character_key text,
    "position" smallint DEFAULT 0 NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roster_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roster_requests (
    name text NOT NULL,
    asks integer DEFAULT 1 NOT NULL,
    first_asked_at timestamp with time zone DEFAULT now() NOT NULL,
    last_asked_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    note text
);


--
-- Name: rosters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rosters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'My Roster'::text NOT NULL,
    style text DEFAULT 'puppet'::text NOT NULL,
    seeded boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: scenes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scenes (
    scene_key text NOT NULL,
    figure_key text NOT NULL,
    topic_id text,
    is_primary boolean DEFAULT false NOT NULL,
    moment text NOT NULL,
    age integer,
    shot text DEFAULT 'portrait'::text NOT NULL,
    angle text DEFAULT 'three-quarter'::text NOT NULL,
    set_key text DEFAULT 'void'::text NOT NULL,
    time_of_day text DEFAULT 'day'::text NOT NULL,
    place text DEFAULT 'interior'::text NOT NULL,
    dress_override text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scenes_age_ck CHECK (((age IS NULL) OR ((age >= 0) AND (age <= 120)))),
    CONSTRAINT scenes_angle_ck CHECK ((angle = ANY (ARRAY['front'::text, 'three-quarter'::text, 'profile'::text, 'over-shoulder'::text, 'low'::text, 'high'::text]))),
    CONSTRAINT scenes_place_ck CHECK ((place = ANY (ARRAY['interior'::text, 'exterior'::text]))),
    CONSTRAINT scenes_set_ck CHECK ((set_key = ANY (ARRAY['void'::text, 'chamber'::text, 'field'::text, 'court'::text, 'shore'::text, 'study'::text, 'street'::text, 'threshold'::text, 'height'::text, 'cell'::text]))),
    CONSTRAINT scenes_shot_ck CHECK ((shot = ANY (ARRAY['portrait'::text, 'medium'::text, 'wide'::text]))),
    CONSTRAINT scenes_time_ck CHECK ((time_of_day = ANY (ARRAY['day'::text, 'twilight'::text, 'night'::text, 'firelit'::text, 'overcast'::text])))
);


--
-- Name: sittings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sittings (
    id bigint NOT NULL,
    topic_id text NOT NULL,
    figure text,
    week_of text NOT NULL,
    heard boolean DEFAULT false NOT NULL,
    votes integer DEFAULT 0 NOT NULL,
    arguments_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sittings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sittings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sittings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sittings_id_seq OWNED BY public.sittings.id;


--
-- Name: somatotypes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.somatotypes (
    key text NOT NULL,
    sex text NOT NULL,
    register text NOT NULL,
    recipe jsonb NOT NULL,
    stature_world numeric(7,3) NOT NULL,
    stature_ft numeric(5,2) NOT NULL,
    source text DEFAULT 'MakeHuman targets (CC0), measured 2026-07-25'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT somatotypes_register_check CHECK ((register = ANY (ARRAY['slight'::text, 'compact'::text, 'lean-tall'::text, 'heavy'::text, 'mythic'::text]))),
    CONSTRAINT somatotypes_sex_check CHECK ((sex = ANY (ARRAY['male'::text, 'female'::text])))
);


--
-- Name: styles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.styles (
    key text NOT NULL,
    name text NOT NULL,
    kind text DEFAULT 'vector'::text NOT NULL,
    spec text NOT NULL,
    validator text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT styles_kind_ck CHECK ((kind = ANY (ARRAY['vector'::text, 'raster'::text]))),
    CONSTRAINT styles_status_ck CHECK ((status = ANY (ARRAY['draft'::text, 'live'::text, 'retired'::text])))
);


--
-- Name: style_coverage; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.style_coverage AS
 SELECT s.key AS style_key,
    s.status,
    count(r.id) FILTER (WHERE (r.status = 'live'::text)) AS rendered,
    ( SELECT count(*) AS count
           FROM public.scenes) AS scenes_total,
    ( SELECT count(*) AS count
           FROM public.scenes
          WHERE scenes.is_primary) AS scenes_primary,
    count(r.id) FILTER (WHERE ((r.status = 'live'::text) AND sc.is_primary)) AS rendered_primary,
    (count(r.id) FILTER (WHERE (r.status = 'live'::text)) = ( SELECT count(*) AS count
           FROM public.scenes)) AS offered
   FROM ((public.styles s
     LEFT JOIN public.renderings r ON ((r.style_key = s.key)))
     LEFT JOIN public.scenes sc ON ((sc.scene_key = r.scene_key)))
  GROUP BY s.key, s.status;


--
-- Name: subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    source text DEFAULT 'site'::text,
    confirmed_at timestamp with time zone,
    unsub_token uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.topics (
    topic_id text NOT NULL,
    payload jsonb NOT NULL,
    mode text DEFAULT 'life'::text NOT NULL,
    status text DEFAULT 'live'::text NOT NULL,
    sources jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    depth smallint DEFAULT 1 NOT NULL,
    figure text
);


--
-- Name: verdicts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verdicts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    figure text NOT NULL,
    topic_id text NOT NULL,
    verdict text NOT NULL,
    tally jsonb DEFAULT '{}'::jsonb NOT NULL,
    total_votes integer DEFAULT 0 NOT NULL,
    judge_role text DEFAULT 'sealed-tally'::text NOT NULL,
    week_of date NOT NULL,
    closed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bell_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bell_log ALTER COLUMN id SET DEFAULT nextval('public.bell_log_id_seq'::regclass);


--
-- Name: readings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.readings ALTER COLUMN id SET DEFAULT nextval('public.readings_id_seq'::regclass);


--
-- Name: renderings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renderings ALTER COLUMN id SET DEFAULT nextval('public.renderings_id_seq'::regclass);


--
-- Name: sittings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sittings ALTER COLUMN id SET DEFAULT nextval('public.sittings_id_seq'::regclass);


--
-- Name: argument_reports argument_reports_argument_id_reporter_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.argument_reports
    ADD CONSTRAINT argument_reports_argument_id_reporter_id_key UNIQUE (argument_id, reporter_id);


--
-- Name: argument_reports argument_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.argument_reports
    ADD CONSTRAINT argument_reports_pkey PRIMARY KEY (id);


--
-- Name: argument_votes argument_votes_argument_id_voter_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.argument_votes
    ADD CONSTRAINT argument_votes_argument_id_voter_id_key UNIQUE (argument_id, voter_id);


--
-- Name: argument_votes argument_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.argument_votes
    ADD CONSTRAINT argument_votes_pkey PRIMARY KEY (id);


--
-- Name: arguments arguments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arguments
    ADD CONSTRAINT arguments_pkey PRIMARY KEY (id);


--
-- Name: arguments arguments_user_id_topic_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arguments
    ADD CONSTRAINT arguments_user_id_topic_id_question_id_key UNIQUE (user_id, topic_id, question_id);


--
-- Name: bell_log bell_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bell_log
    ADD CONSTRAINT bell_log_pkey PRIMARY KEY (id);


--
-- Name: calendar calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar
    ADD CONSTRAINT calendar_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (key);


--
-- Name: emerald_ledger emerald_ledger_once; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emerald_ledger
    ADD CONSTRAINT emerald_ledger_once UNIQUE (user_id, reason, reference);


--
-- Name: emerald_ledger emerald_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emerald_ledger
    ADD CONSTRAINT emerald_ledger_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: quizzard_queue quizzard_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzard_queue
    ADD CONSTRAINT quizzard_queue_pkey PRIMARY KEY (figure_name);


--
-- Name: readings readings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.readings
    ADD CONSTRAINT readings_pkey PRIMARY KEY (id);


--
-- Name: refs refs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refs
    ADD CONSTRAINT refs_pkey PRIMARY KEY (key);


--
-- Name: renderings renderings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renderings
    ADD CONSTRAINT renderings_pkey PRIMARY KEY (id);


--
-- Name: renderings renderings_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renderings
    ADD CONSTRAINT renderings_unique UNIQUE (scene_key, style_key);


--
-- Name: rig_views rig_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rig_views
    ADD CONSTRAINT rig_views_pkey PRIMARY KEY (rig_key, pose, angle_name);


--
-- Name: rigs rigs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rigs
    ADD CONSTRAINT rigs_pkey PRIMARY KEY (key);


--
-- Name: roster_members roster_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roster_members
    ADD CONSTRAINT roster_members_pkey PRIMARY KEY (roster_id, figure);


--
-- Name: roster_requests roster_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roster_requests
    ADD CONSTRAINT roster_requests_pkey PRIMARY KEY (name);


--
-- Name: rosters rosters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rosters
    ADD CONSTRAINT rosters_pkey PRIMARY KEY (id);


--
-- Name: scene_refs scene_refs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scene_refs
    ADD CONSTRAINT scene_refs_pkey PRIMARY KEY (scene_key, ref_key);


--
-- Name: scenes scenes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scenes
    ADD CONSTRAINT scenes_pkey PRIMARY KEY (scene_key);


--
-- Name: sittings sittings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sittings
    ADD CONSTRAINT sittings_pkey PRIMARY KEY (id);


--
-- Name: somatotypes somatotypes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.somatotypes
    ADD CONSTRAINT somatotypes_pkey PRIMARY KEY (key);


--
-- Name: styles styles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.styles
    ADD CONSTRAINT styles_pkey PRIMARY KEY (key);


--
-- Name: subscribers subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_email_key UNIQUE (email);


--
-- Name: subscribers subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_pkey PRIMARY KEY (id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (topic_id);


--
-- Name: verdicts verdicts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verdicts
    ADD CONSTRAINT verdicts_pkey PRIMARY KEY (id);


--
-- Name: verdicts verdicts_topic_week_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verdicts
    ADD CONSTRAINT verdicts_topic_week_unique UNIQUE (topic_id, week_of);


--
-- Name: argument_votes_arg_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX argument_votes_arg_idx ON public.argument_votes USING btree (argument_id);


--
-- Name: arguments_feed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX arguments_feed_idx ON public.arguments USING btree (topic_id, question_id, status, vote_count DESC);


--
-- Name: arguments_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX arguments_user_idx ON public.arguments USING btree (user_id);


--
-- Name: bell_log_period_trigger; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bell_log_period_trigger ON public.bell_log USING btree (period, trigger);


--
-- Name: calendar_figure_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calendar_figure_idx ON public.calendar USING btree (figure);


--
-- Name: calendar_once; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX calendar_once ON public.calendar USING btree (figure, kind, month, COALESCE((day)::integer, 0));


--
-- Name: calendar_when_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX calendar_when_idx ON public.calendar USING btree (status, month, day);


--
-- Name: characters_figure_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX characters_figure_idx ON public.characters USING btree (figure);


--
-- Name: characters_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX characters_status_idx ON public.characters USING btree (status);


--
-- Name: emerald_ledger_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emerald_ledger_user_idx ON public.emerald_ledger USING btree (user_id);


--
-- Name: members_figure_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX members_figure_idx ON public.roster_members USING btree (figure);


--
-- Name: members_pos_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX members_pos_idx ON public.roster_members USING btree (roster_id, "position");


--
-- Name: queue_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX queue_order_idx ON public.quizzard_queue USING btree (status, band, wants DESC, rank);


--
-- Name: queue_status_rank_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX queue_status_rank_idx ON public.quizzard_queue USING btree (status, rank);


--
-- Name: readings_by_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX readings_by_topic ON public.readings USING btree (topic_id);


--
-- Name: readings_by_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX readings_by_user ON public.readings USING btree (user_id, read_on DESC);


--
-- Name: refs_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refs_kind_idx ON public.refs USING btree (kind, status);


--
-- Name: refs_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refs_region_idx ON public.refs USING btree (region);


--
-- Name: renderings_style_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX renderings_style_idx ON public.renderings USING btree (style_key, status);


--
-- Name: rigs_one_default_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX rigs_one_default_uq ON public.rigs USING btree (is_default) WHERE is_default;


--
-- Name: rigs_proportion_body_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX rigs_proportion_body_uq ON public.rigs USING btree (proportion, body_type);


--
-- Name: roster_requests_asks_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX roster_requests_asks_idx ON public.roster_requests USING btree (status, asks DESC);


--
-- Name: rosters_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rosters_user_idx ON public.rosters USING btree (user_id);


--
-- Name: scene_refs_ref_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scene_refs_ref_idx ON public.scene_refs USING btree (ref_key);


--
-- Name: scenes_figure_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scenes_figure_idx ON public.scenes USING btree (figure_key);


--
-- Name: scenes_no_repeat; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX scenes_no_repeat ON public.scenes USING btree (figure_key, shot, set_key, time_of_day);


--
-- Name: scenes_one_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX scenes_one_primary ON public.scenes USING btree (figure_key) WHERE is_primary;


--
-- Name: scenes_topic_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scenes_topic_idx ON public.scenes USING btree (topic_id);


--
-- Name: sittings_once; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sittings_once ON public.sittings USING btree (topic_id, week_of);


--
-- Name: subscribers_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX subscribers_email_idx ON public.subscribers USING btree (lower(email));


--
-- Name: subscribers_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscribers_status_idx ON public.subscribers USING btree (status);


--
-- Name: subscribers_unsub_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscribers_unsub_idx ON public.subscribers USING btree (unsub_token);


--
-- Name: topics_figure_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX topics_figure_idx ON public.topics USING btree (figure, depth);


--
-- Name: topics_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX topics_status_idx ON public.topics USING btree (status);


--
-- Name: verdicts_figure_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verdicts_figure_idx ON public.verdicts USING btree (figure, closed_at DESC);


--
-- Name: verdicts_week_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verdicts_week_idx ON public.verdicts USING btree (week_of DESC);


--
-- Name: roster_members roster_cap; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER roster_cap BEFORE INSERT ON public.roster_members FOR EACH ROW EXECUTE FUNCTION public.enforce_roster_cap();


--
-- Name: topics topics_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER topics_touch BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.touch_topics_updated_at();


--
-- Name: argument_reports trg_argument_report; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_argument_report AFTER INSERT ON public.argument_reports FOR EACH ROW EXECUTE FUNCTION public.handle_argument_report();


--
-- Name: argument_votes trg_vote_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vote_count AFTER INSERT OR DELETE ON public.argument_votes FOR EACH ROW EXECUTE FUNCTION public.sync_argument_vote_count();


--
-- Name: argument_reports argument_reports_argument_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.argument_reports
    ADD CONSTRAINT argument_reports_argument_id_fkey FOREIGN KEY (argument_id) REFERENCES public.arguments(id) ON DELETE CASCADE;


--
-- Name: argument_reports argument_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.argument_reports
    ADD CONSTRAINT argument_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: argument_votes argument_votes_argument_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.argument_votes
    ADD CONSTRAINT argument_votes_argument_id_fkey FOREIGN KEY (argument_id) REFERENCES public.arguments(id) ON DELETE CASCADE;


--
-- Name: argument_votes argument_votes_voter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.argument_votes
    ADD CONSTRAINT argument_votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: arguments arguments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arguments
    ADD CONSTRAINT arguments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: emerald_ledger emerald_ledger_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emerald_ledger
    ADD CONSTRAINT emerald_ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: renderings renderings_scene_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renderings
    ADD CONSTRAINT renderings_scene_key_fkey FOREIGN KEY (scene_key) REFERENCES public.scenes(scene_key) ON DELETE CASCADE;


--
-- Name: renderings renderings_style_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renderings
    ADD CONSTRAINT renderings_style_key_fkey FOREIGN KEY (style_key) REFERENCES public.styles(key) ON DELETE CASCADE;


--
-- Name: rig_views rig_views_rig_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rig_views
    ADD CONSTRAINT rig_views_rig_key_fkey FOREIGN KEY (rig_key) REFERENCES public.rigs(key);


--
-- Name: roster_members roster_members_roster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roster_members
    ADD CONSTRAINT roster_members_roster_id_fkey FOREIGN KEY (roster_id) REFERENCES public.rosters(id) ON DELETE CASCADE;


--
-- Name: scene_refs scene_refs_ref_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scene_refs
    ADD CONSTRAINT scene_refs_ref_key_fkey FOREIGN KEY (ref_key) REFERENCES public.refs(key) ON DELETE CASCADE;


--
-- Name: scene_refs scene_refs_scene_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scene_refs
    ADD CONSTRAINT scene_refs_scene_key_fkey FOREIGN KEY (scene_key) REFERENCES public.scenes(scene_key) ON DELETE CASCADE;


--
-- Name: subscribers anon can subscribe; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "anon can subscribe" ON public.subscribers FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: argument_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.argument_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: argument_reports argument_reports_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY argument_reports_insert_own ON public.argument_reports FOR INSERT TO authenticated WITH CHECK ((reporter_id = auth.uid()));


--
-- Name: argument_reports argument_reports_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY argument_reports_read_own ON public.argument_reports FOR SELECT TO authenticated USING ((reporter_id = auth.uid()));


--
-- Name: argument_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.argument_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: argument_votes argument_votes_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY argument_votes_read_own ON public.argument_votes FOR SELECT TO authenticated USING ((voter_id = auth.uid()));


--
-- Name: arguments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.arguments ENABLE ROW LEVEL SECURITY;

--
-- Name: arguments arguments_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY arguments_read ON public.arguments FOR SELECT TO authenticated USING (((status = 'visible'::text) OR (user_id = auth.uid())));


--
-- Name: bell_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bell_log ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar ENABLE ROW LEVEL SECURITY;

--
-- Name: characters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

--
-- Name: emerald_ledger; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emerald_ledger ENABLE ROW LEVEL SECURITY;

--
-- Name: emerald_ledger ledger_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ledger_read_own ON public.emerald_ledger FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_read_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_read_own ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: profiles profiles_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: subscribers public can subscribe; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public can subscribe" ON public.subscribers FOR INSERT TO anon WITH CHECK (true);


--
-- Name: quizzard_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quizzard_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: readings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

--
-- Name: refs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refs ENABLE ROW LEVEL SECURITY;

--
-- Name: renderings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.renderings ENABLE ROW LEVEL SECURITY;

--
-- Name: rig_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rig_views ENABLE ROW LEVEL SECURITY;

--
-- Name: rigs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rigs ENABLE ROW LEVEL SECURITY;

--
-- Name: roster_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roster_members ENABLE ROW LEVEL SECURITY;

--
-- Name: roster_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roster_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: rosters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rosters ENABLE ROW LEVEL SECURITY;

--
-- Name: scene_refs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scene_refs ENABLE ROW LEVEL SECURITY;

--
-- Name: scenes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

--
-- Name: sittings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sittings ENABLE ROW LEVEL SECURITY;

--
-- Name: somatotypes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.somatotypes ENABLE ROW LEVEL SECURITY;

--
-- Name: styles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;

--
-- Name: subscribers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

--
-- Name: topics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

--
-- Name: verdicts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verdicts ENABLE ROW LEVEL SECURITY;

--
-- Name: verdicts verdicts_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY verdicts_public_read ON public.verdicts FOR SELECT USING (true);


--
-- PostgreSQL database dump complete
--


