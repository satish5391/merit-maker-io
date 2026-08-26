CREATE TABLE IF NOT EXISTS public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  badge_text text NOT NULL DEFAULT 'Featured',
  image_url text NOT NULL DEFAULT '',
  cta_text text NOT NULL DEFAULT 'Explore Now',
  cta_link text NOT NULL DEFAULT '/',
  placement text NOT NULL DEFAULT 'hero_carousel' CHECK (placement IN ('hero_carousel', 'sidebar_banner', 'inline_card', 'floating_bar')),
  is_external boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  gradient_theme text NOT NULL DEFAULT 'blue_glow' CHECK (gradient_theme IN ('blue_glow', 'purple_magic', 'sunset_amber', 'emerald_pro')),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS advertisements_placement_active_order_idx
  ON public.advertisements (placement, is_active, display_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advertisements TO anon, authenticated;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "advertisements public access" ON public.advertisements;
CREATE POLICY "advertisements public access" ON public.advertisements
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
