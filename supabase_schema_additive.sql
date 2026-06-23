-- =========================================================
-- YatraGo Additive Schema Update
-- Safe to run on existing database. Does NOT drop data.
-- =========================================================

-- 1. Create the new Payment Orders table
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'INR',
  payment_method text NOT NULL CHECK (
    payment_method IN ('credit_card','debit_card','upi')
  ),
  gateway text NOT NULL, -- razorpay, stripe, cashfree
  gateway_order_id text,
  gateway_payment_id text,
  status text DEFAULT 'created' CHECK (
    status IN ('created','pending','paid','failed','expired','refunded')
  ),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Add the new column to wallet_transactions safely
ALTER TABLE public.wallet_transactions 
  ADD COLUMN IF NOT EXISTS payment_order_id uuid REFERENCES public.payment_orders(id);

-- 3. Enable RLS on the new table
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- 4. Add Policies for payment_orders
DROP POLICY IF EXISTS "Users view own payment orders" ON public.payment_orders;
CREATE POLICY "Users view own payment orders" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own payment orders" ON public.payment_orders;
CREATE POLICY "Users create own payment orders" ON public.payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'created');

-- 5. Add Functions
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_payment_order_id uuid,
  p_payment_method text,
  p_description text DEFAULT 'Wallet top-up'
)
RETURNS public.wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet public.wallets;
  v_txn public.wallet_transactions;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet IS NULL THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (p_user_id, 0) RETURNING * INTO v_wallet;
  END IF;

  UPDATE public.wallets SET balance = balance + p_amount WHERE user_id = p_user_id RETURNING * INTO v_wallet;

  UPDATE public.payment_orders SET status = 'paid', updated_at = now() WHERE id = p_payment_order_id;

  INSERT INTO public.wallet_transactions (
    user_id, payment_order_id, type, payment_method,
    amount, description, balance_before, balance_after
  ) VALUES (
    p_user_id, p_payment_order_id, 'ADD_MONEY', p_payment_method,
    p_amount, p_description, v_wallet.balance - p_amount, v_wallet.balance
  ) RETURNING * INTO v_txn;

  RETURN v_txn;
END;
$$;

CREATE OR REPLACE FUNCTION public.debit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_description text DEFAULT 'Booking payment'
)
RETURNS public.wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet public.wallets;
  v_txn public.wallet_transactions;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet IS NULL OR v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  UPDATE public.wallets SET balance = balance - p_amount WHERE user_id = p_user_id RETURNING * INTO v_wallet;

  INSERT INTO public.wallet_transactions (
    user_id, type, payment_method, amount,
    description, balance_before, balance_after
  ) VALUES (
    p_user_id, 'DEDUCT_MONEY', 'wallet', p_amount,
    p_description, v_wallet.balance + p_amount, v_wallet.balance
  ) RETURNING * INTO v_txn;

  RETURN v_txn;
END;
$$;

-- 6. Add Indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);
