-- Fix: Allow group leaders to also view members (not just existing members)
DROP POLICY "Members can view group members" ON public.group_members;

CREATE POLICY "Members and leaders can view group members"
ON public.group_members
FOR SELECT
USING (
  is_group_member(auth.uid(), group_id) 
  OR EXISTS (
    SELECT 1 FROM study_groups 
    WHERE study_groups.id = group_members.group_id 
    AND study_groups.leader_id = auth.uid()
  )
);