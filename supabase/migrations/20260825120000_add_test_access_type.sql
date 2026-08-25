ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS discount_price numeric,
  ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'free'
  CHECK (access_type IN ('free', 'paid', 'package_only'));

UPDATE public.tests
SET access_type = CASE
  WHEN COALESCE(is_free, false) = true OR COALESCE(price, 0) = 0 THEN 'free'
  ELSE 'paid'
END
WHERE access_type = 'free';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tests TO anon, authenticated;
