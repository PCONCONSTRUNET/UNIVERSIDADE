-- Allow service role (via RLS bypass) to delete payments
-- Add policy for admins to delete payments too
CREATE POLICY "Admins can delete payments"
ON public.payments
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;