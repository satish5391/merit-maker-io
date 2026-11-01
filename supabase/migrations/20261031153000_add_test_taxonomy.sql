ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS subject_subsection text;

ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS series_type text NOT NULL DEFAULT 'standard_mock';

COMMENT ON COLUMN public.tests.subject_subsection IS 'Fine-grained subject category, such as Accountancy or Reasoning under the main subject.';
COMMENT ON COLUMN public.tests.series_type IS 'Test series classification used for admin organization and student-facing grouping.';
