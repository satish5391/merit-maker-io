ALTER TABLE public.tests
  DROP COLUMN IF EXISTS subject_subsection,
  DROP COLUMN IF EXISTS series_type;
