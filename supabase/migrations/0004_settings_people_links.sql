-- 0004: Phase 2.1 — settings, people, action-link extraction, multi-plotto captures.
--
-- New user fields:
--   work_schedule           jsonb  {"days":[1..5], "start":"09:00", "end":"17:00"}
--   phone                   text
--   phone_verified          boolean default false
--   email_reminders_enabled boolean default true
--
-- New event fields:
--   meeting_links  jsonb  [{ "type":"zoom"|"meet"|"teams"|"webex"|"phone"|"url", "url":"...", "label":"..."}]
--   phone_numbers  jsonb  [{ "number":"+1 212 555 0100", "label":"Dr. office" }]
--
-- New tables:
--   people         (id, user_id, name, normalized_name, color, notes)
--   event_people   (event_id, person_id)           junction

-- ── users ────────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS work_schedule           jsonb,
  ADD COLUMN IF NOT EXISTS phone                   text,
  ADD COLUMN IF NOT EXISTS phone_verified          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_reminders_enabled boolean NOT NULL DEFAULT true;

-- ── events ───────────────────────────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS meeting_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phone_numbers jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ── people ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.people (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  normalized_name text NOT NULL,   -- lower(trim(name)), for dedupe
  color           text NOT NULL DEFAULT 'coral',
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, normalized_name)
);

CREATE INDEX IF NOT EXISTS people_user_idx ON public.people(user_id);

-- ── event_people ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_people (
  event_id  uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, person_id)
);

CREATE INDEX IF NOT EXISTS event_people_person_idx ON public.event_people(person_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.people       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS people_self ON public.people;
CREATE POLICY people_self ON public.people
  FOR ALL TO authenticated
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- event_people inherits access from the parent event (user owns the event).
DROP POLICY IF EXISTS event_people_self ON public.event_people;
CREATE POLICY event_people_self ON public.event_people
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events e
              WHERE e.id = event_people.event_id
                AND e.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e
              WHERE e.id = event_people.event_id
                AND e.user_id = auth.uid())
  );

-- ── Grants ───────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.people       TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_people TO authenticated, service_role;

-- updated_at trigger for people.
CREATE OR REPLACE FUNCTION public.tg_people_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS people_set_updated_at ON public.people;
CREATE TRIGGER people_set_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW EXECUTE FUNCTION public.tg_people_set_updated_at();
