ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation text NOT NULL DEFAULT '';
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS max_attempts integer;
ALTER TABLE public.tests ALTER COLUMN max_attempts SET DEFAULT 1;
UPDATE public.tests SET max_attempts = 1 WHERE max_attempts IS NULL;
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb;