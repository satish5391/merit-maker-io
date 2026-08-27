ALTER TABLE public.advertisements
  ADD COLUMN IF NOT EXISTS banner_type text NOT NULL DEFAULT 'standard'
  CHECK (banner_type IN ('standard', 'direct_image'));