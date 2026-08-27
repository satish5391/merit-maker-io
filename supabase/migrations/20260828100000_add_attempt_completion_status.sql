ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed'
  CHECK (status IN ('in_progress', 'completed'));