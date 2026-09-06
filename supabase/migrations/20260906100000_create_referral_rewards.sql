CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT 'RD' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL OR referral_code = '';

ALTER TABLE public.profiles
  ALTER COLUMN referral_code SET DEFAULT public.generate_referral_code();

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key
  ON public.profiles(referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coin_transactions_user_id_idx
  ON public.coin_transactions(user_id);

GRANT SELECT, INSERT, UPDATE ON public.profiles, public.coin_transactions TO anon, authenticated;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coin transactions public access" ON public.coin_transactions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.redeem_checkout_coins(
  p_user_id uuid,
  p_amount integer,
  p_description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RETURN true;
  END IF;

  SELECT coins INTO current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET coins = coins - p_amount
  WHERE id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'spent_checkout', p_description);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_checkout_coins(uuid, integer, text) TO authenticated;