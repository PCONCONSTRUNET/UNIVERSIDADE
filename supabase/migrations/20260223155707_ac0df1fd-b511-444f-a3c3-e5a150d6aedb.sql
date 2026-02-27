
DROP POLICY "Service role can manage all subscriptions" ON public.subscriptions;

CREATE POLICY "Users can update own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);
