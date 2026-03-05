
-- Add onboarding fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_salary numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dependents integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_score integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Bank Accounts table
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_name text NOT NULL,
  account_type text NOT NULL DEFAULT 'savings',
  account_number text,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bank accounts" ON public.bank_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fixed Deposits table
CREATE TABLE public.fixed_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_name text NOT NULL,
  amount numeric NOT NULL,
  interest_rate numeric NOT NULL,
  start_date date NOT NULL,
  maturity_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.fixed_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own FDs" ON public.fixed_deposits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Recurring Deposits table
CREATE TABLE public.recurring_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_name text NOT NULL,
  monthly_amount numeric NOT NULL,
  interest_rate numeric NOT NULL,
  start_date date NOT NULL,
  maturity_date date NOT NULL,
  total_deposited numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.recurring_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own RDs" ON public.recurring_deposits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
