ALTER TABLE public.user_purchases
  ADD COLUMN IF NOT EXISTS payment_id text;