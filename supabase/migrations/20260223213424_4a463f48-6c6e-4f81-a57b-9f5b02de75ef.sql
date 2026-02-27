
-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;

-- Generate unique referral codes for existing profiles
UPDATE public.profiles SET referral_code = UPPER(SUBSTR(MD5(user_id::text || id::text), 1, 8)) WHERE referral_code IS NULL;

-- Create function to auto-generate referral code on new profile
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTR(MD5(NEW.user_id::text || gen_random_uuid()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reward_granted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  converted_at timestamp with time zone
);

-- Unique constraint: each referred user can only be referred once
ALTER TABLE public.referrals ADD CONSTRAINT referrals_referred_id_key UNIQUE (referred_id);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own referrals as referrer"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view own referral as referred"
ON public.referrals FOR SELECT
USING (auth.uid() = referred_id);

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referred_id);

-- Create function to grant referral rewards
CREATE OR REPLACE FUNCTION public.process_referral_rewards(_referrer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_converted integer;
  rewards_already_given integer;
  months_to_add integer;
  current_end timestamp with time zone;
  new_end timestamp with time zone;
BEGIN
  -- Count total converted referrals
  SELECT COUNT(*) INTO total_converted
  FROM public.referrals
  WHERE referrer_id = _referrer_id AND status = 'converted';

  -- Calculate total months earned:
  -- Every 5 referrals = 1 month, but at 30 = 6 months total (bonus)
  IF total_converted >= 30 THEN
    months_to_add := 6 + ((total_converted - 30) / 5);
  ELSE
    months_to_add := total_converted / 5;
  END IF;

  -- Count months already granted
  SELECT COALESCE(COUNT(*), 0) INTO rewards_already_given
  FROM public.referrals
  WHERE referrer_id = _referrer_id AND reward_granted = true;

  -- Calculate how many new reward months to give
  -- Each reward_granted=true represents 1 reward cycle processed
  -- We use a simpler approach: mark all converted as reward_granted and extend subscription
  
  -- Get current subscription end
  SELECT current_period_end INTO current_end
  FROM public.subscriptions
  WHERE user_id = _referrer_id;

  IF current_end IS NULL THEN
    current_end := now();
  END IF;

  -- If end is in the past, start from now
  IF current_end < now() THEN
    current_end := now();
  END IF;

  -- Calculate new months to add (total earned minus already granted groups of 5)
  DECLARE
    already_granted_months integer;
    new_months integer;
  BEGIN
    SELECT COUNT(*) INTO already_granted_months
    FROM public.referrals
    WHERE referrer_id = _referrer_id AND reward_granted = true;

    -- Mark newly converted referrals as reward_granted
    -- Calculate based on thresholds
    IF total_converted >= 30 AND NOT EXISTS (
      SELECT 1 FROM public.referrals 
      WHERE referrer_id = _referrer_id AND reward_granted = true
      HAVING COUNT(*) >= 30
    ) THEN
      -- Grant the 30-referral bonus (6 months total)
      new_months := 6 - (already_granted_months / 5);
    ELSE
      new_months := (total_converted / 5) - (already_granted_months / 5);
    END IF;

    IF new_months > 0 THEN
      new_end := current_end + (new_months || ' months')::interval;

      -- Update subscription
      UPDATE public.subscriptions
      SET 
        status = 'active',
        current_period_end = new_end,
        updated_at = now()
      WHERE user_id = _referrer_id;

      -- Mark referrals as reward_granted up to the threshold
      UPDATE public.referrals
      SET reward_granted = true
      WHERE referrer_id = _referrer_id 
        AND status = 'converted' 
        AND reward_granted = false;
    END IF;
  END;
END;
$$;

-- Function to find referrer by code (security definer)
CREATE OR REPLACE FUNCTION public.find_referrer_by_code(_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.profiles WHERE referral_code = UPPER(_code) LIMIT 1;
$$;
