
-- Create payments table to store individual payment transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mp_payment_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  status_detail TEXT,
  payment_method TEXT,
  payment_type TEXT,
  transaction_amount NUMERIC NOT NULL DEFAULT 0,
  payer_email TEXT,
  description TEXT,
  external_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Admin can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view own payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Service role inserts (from edge functions) - allow insert for authenticated users
CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_mp_payment_id ON public.payments(mp_payment_id);
CREATE INDEX idx_payments_status ON public.payments(status);
