
CREATE TABLE public.users_financial_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  monthly_salary numeric DEFAULT 0,
  other_income jsonb DEFAULT '[]'::jsonb,
  loans jsonb DEFAULT '[]'::jsonb,
  insurance jsonb DEFAULT '[]'::jsonb,
  credit_score integer DEFAULT 0,
  fds_rds jsonb DEFAULT '[]'::jsonb,
  dependents integer DEFAULT 0,
  financial_goals text,
  currency text DEFAULT 'INR',
  onboarding_step integer DEFAULT 0,
  onboarding_complete boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.users_financial_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial profile"
  ON public.users_financial_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own financial profile"
  ON public.users_financial_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own financial profile"
  ON public.users_financial_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Auto-create financial profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_financial_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.users_financial_profile (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_financial_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_financial_profile();
