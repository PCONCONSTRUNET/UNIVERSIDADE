-- Fix: Allow leaders to view their own groups (needed for INSERT...RETURNING to work)
DROP POLICY "Members can view their groups" ON public.study_groups;

CREATE POLICY "Members and leaders can view their groups"
ON public.study_groups
FOR SELECT
USING (is_group_member(auth.uid(), id) OR auth.uid() = leader_id);

-- Also fix group_members INSERT: allow leader to add themselves during group creation
-- The current policy uses a subquery on study_groups which works, but let's also allow self-insert
DROP POLICY "Group leaders can add members" ON public.group_members;

CREATE POLICY "Leaders or self can add members"
ON public.group_members
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM study_groups
    WHERE study_groups.id = group_members.group_id
    AND study_groups.leader_id = auth.uid()
  ))
  OR (auth.uid() = user_id)
);