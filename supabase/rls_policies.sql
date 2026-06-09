-- Row Level Security (RLS) Policies for Fiscal App
-- Ensures multi-tenant data isolation and security
-- DPDP Act compliant data access control

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_financial_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- USERS_FINANCIAL_PROFILE TABLE
-- ============================================================================
-- Users can view their own financial profile
CREATE POLICY "Users can view own financial profile"
ON public.users_financial_profile FOR SELECT
USING (auth.uid() = id);

-- Users can update their own financial profile
CREATE POLICY "Users can update own financial profile"
ON public.users_financial_profile FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own financial profile
CREATE POLICY "Users can insert own financial profile"
ON public.users_financial_profile FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions"
ON public.transactions FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
ON public.transactions FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- BUDGETS TABLE
-- ============================================================================
CREATE POLICY "Users can view own budgets"
ON public.budgets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
ON public.budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
ON public.budgets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
ON public.budgets FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- GOALS TABLE
-- ============================================================================
CREATE POLICY "Users can view own goals"
ON public.goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
ON public.goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
ON public.goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
ON public.goals FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- LOANS TABLE
-- ============================================================================
CREATE POLICY "Users can view own loans"
ON public.loans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loans"
ON public.loans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans"
ON public.loans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loans"
ON public.loans FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- INSURANCE_POLICIES TABLE
-- ============================================================================
CREATE POLICY "Users can view own insurance policies"
ON public.insurance_policies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insurance policies"
ON public.insurance_policies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insurance policies"
ON public.insurance_policies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insurance policies"
ON public.insurance_policies FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- BANK_ACCOUNTS TABLE
-- ============================================================================
CREATE POLICY "Users can view own bank accounts"
ON public.bank_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts"
ON public.bank_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts"
ON public.bank_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts"
ON public.bank_accounts FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- FIXED_DEPOSITS TABLE
-- ============================================================================
CREATE POLICY "Users can view own FDs"
ON public.fixed_deposits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own FDs"
ON public.fixed_deposits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own FDs"
ON public.fixed_deposits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own FDs"
ON public.fixed_deposits FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- RECURRING_DEPOSITS TABLE
-- ============================================================================
CREATE POLICY "Users can view own RDs"
ON public.recurring_deposits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own RDs"
ON public.recurring_deposits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RDs"
ON public.recurring_deposits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own RDs"
ON public.recurring_deposits FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- REAL_ESTATE TABLE
-- ============================================================================
CREATE POLICY "Users can view own properties"
ON public.real_estate FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
ON public.real_estate FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
ON public.real_estate FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
ON public.real_estate FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
ON public.subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- AUDIT TRAIL (Optional but recommended for DPDP compliance)
-- ============================================================================
-- Create audit trail table to track data access
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  affected_rows INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_log FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================================
-- DATA RETENTION POLICIES (DPDP Act Compliance)
-- ============================================================================
-- Mark deleted data for 90-day retention before permanent deletion
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS deletion_date TIMESTAMP WITH TIME ZONE;

-- Similar columns can be added to other tables for compliance with DPDP Act
-- This allows users to request data deletion while maintaining recovery window

-- Function to soft-delete transactions
CREATE OR REPLACE FUNCTION soft_delete_transaction()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_deleted = true;
  NEW.deletion_date = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant SELECT permission to authenticated users only
GRANT SELECT ON public.audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fixed_deposits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_deposits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.real_estate TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users_financial_profile TO authenticated;

-- IMPORTANT: These policies must be deployed to Supabase before data access
-- Supabase Docs: https://supabase.com/docs/guides/auth/row-level-security
