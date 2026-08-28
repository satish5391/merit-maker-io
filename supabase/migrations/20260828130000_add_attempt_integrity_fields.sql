ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS tab_switches_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS integrity_status text NOT NULL DEFAULT 'clean';

ALTER TABLE public.attempts
  DROP CONSTRAINT IF EXISTS attempts_integrity_status_check;

ALTER TABLE public.attempts
  ADD CONSTRAINT attempts_integrity_status_check
  CHECK (integrity_status IN ('clean', 'flagged'));