
-- Allow admins to delete from all user-related tables
CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any subscription"
  ON public.subscriptions FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any subject"
  ON public.subjects FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any activity"
  ON public.activities FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any note"
  ON public.notes FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any attendance"
  ON public.attendance FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any course"
  ON public.courses FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any goal"
  ON public.goals FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any material"
  ON public.materials FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any chat_conversation"
  ON public.chat_conversations FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any chat_message"
  ON public.chat_messages FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any referral"
  ON public.referrals FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
