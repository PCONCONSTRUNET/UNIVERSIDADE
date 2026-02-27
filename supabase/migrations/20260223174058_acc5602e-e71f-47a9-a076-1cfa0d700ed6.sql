
-- Study Groups
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  description TEXT,
  deadline DATE,
  leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

-- Group Members
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'leader' or 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Group Tasks (assigned to members)
CREATE TABLE public.group_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.group_tasks ENABLE ROW LEVEL SECURITY;

-- Group Messages (chat)
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Group Links/Files
CREATE TABLE public.group_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.group_links ENABLE ROW LEVEL SECURITY;

-- Group Polls
CREATE TABLE public.group_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  votes JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.group_polls ENABLE ROW LEVEL SECURITY;

-- Security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- RLS Policies for study_groups
CREATE POLICY "Members can view their groups"
  ON public.study_groups FOR SELECT
  USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create groups"
  ON public.study_groups FOR INSERT
  WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Leaders can update their groups"
  ON public.study_groups FOR UPDATE
  USING (auth.uid() = leader_id);

CREATE POLICY "Leaders can delete their groups"
  ON public.study_groups FOR DELETE
  USING (auth.uid() = leader_id);

-- RLS Policies for group_members
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group leaders can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE id = group_id AND leader_id = auth.uid()
    )
    OR auth.uid() = user_id -- allow self-join for leader
  );

CREATE POLICY "Group leaders can remove members"
  ON public.group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE id = group_id AND leader_id = auth.uid()
    )
    OR auth.uid() = user_id -- members can leave
  );

-- RLS Policies for group_tasks
CREATE POLICY "Members can view group tasks"
  ON public.group_tasks FOR SELECT
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can create tasks"
  ON public.group_tasks FOR INSERT
  WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = created_by);

CREATE POLICY "Members can update tasks"
  ON public.group_tasks FOR UPDATE
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Task creators can delete tasks"
  ON public.group_tasks FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for group_messages
CREATE POLICY "Members can view messages"
  ON public.group_messages FOR SELECT
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = user_id);

-- RLS Policies for group_links
CREATE POLICY "Members can view links"
  ON public.group_links FOR SELECT
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can add links"
  ON public.group_links FOR INSERT
  WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = user_id);

CREATE POLICY "Link owners can delete links"
  ON public.group_links FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for group_polls
CREATE POLICY "Members can view polls"
  ON public.group_polls FOR SELECT
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can create polls"
  ON public.group_polls FOR INSERT
  WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = created_by);

CREATE POLICY "Members can vote on polls"
  ON public.group_polls FOR UPDATE
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Poll creators can delete polls"
  ON public.group_polls FOR DELETE
  USING (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_tasks_updated_at
  BEFORE UPDATE ON public.group_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
