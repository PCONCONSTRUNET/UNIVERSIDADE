import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StudyGroup {
  id: string;
  name: string;
  subjectId: string | null;
  description: string | null;
  deadline: string | null;
  leaderId: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: string;
  displayName?: string;
  email?: string;
}

export interface GroupTask {
  id: string;
  groupId: string;
  title: string;
  assignedTo: string | null;
  completed: boolean;
  createdBy: string;
  deadline: string | null;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  createdAt: string;
  displayName?: string;
}

export interface GroupLink {
  id: string;
  groupId: string;
  userId: string;
  title: string;
  url: string;
  createdAt: string;
}

export interface GroupPoll {
  id: string;
  groupId: string;
  question: string;
  options: string[];
  votes: Record<string, string>; // userId -> option
  createdBy: string;
  closed: boolean;
}

export function useStudyGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('study_groups')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setGroups(data.map((g: any) => ({
        id: g.id,
        name: g.name,
        subjectId: g.subject_id,
        description: g.description,
        deadline: g.deadline,
        leaderId: g.leader_id,
        createdAt: g.created_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const createGroup = async (group: { name: string; subjectId?: string; description?: string; deadline?: string }) => {
    if (!user) return;
    const { data, error } = await supabase.from('study_groups').insert({
      name: group.name,
      subject_id: group.subjectId || null,
      description: group.description || null,
      deadline: group.deadline || null,
      leader_id: user.id,
    } as any).select().single();

    if (data && !error) {
      // Add leader as member
      await supabase.from('group_members').insert({
        group_id: (data as any).id,
        user_id: user.id,
        role: 'leader',
      } as any);
      await fetchGroups();
    }
    return { data, error };
  };

  const deleteGroup = async (id: string) => {
    await supabase.from('study_groups').delete().eq('id', id);
    await fetchGroups();
  };

  return { groups, loading, createGroup, deleteGroup, refetch: fetchGroups };
}

export function useGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<GroupMember[]>([]);

  const fetchMembers = useCallback(async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId);
    if (data) {
      // Fetch display names from profiles
      const userIds = data.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setMembers(data.map((m: any) => {
        const profile = profileMap.get(m.user_id);
        return {
          id: m.id,
          groupId: m.group_id,
          userId: m.user_id,
          role: m.role,
          joinedAt: m.joined_at,
          displayName: profile?.display_name || undefined,
          email: profile?.email || undefined,
        };
      }));
    }
  }, [groupId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const inviteByEmail = async (email: string, groupId: string) => {
    // Use secure function to find user by email
    const { data: userId, error: findError } = await supabase
      .rpc('find_user_by_email', { _email: email });

    if (findError || !userId) return { error: { message: 'Usuário não encontrado com esse email' } };

    // Check if already a member
    const existing = members.find(m => m.userId === userId);
    if (existing) return { error: { message: 'Este usuário já é membro do grupo' } };

    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    } as any);

    if (!error) await fetchMembers();
    return { error };
  };

  const removeMember = async (memberId: string) => {
    await supabase.from('group_members').delete().eq('id', memberId);
    await fetchMembers();
  };

  return { members, inviteByEmail, removeMember, refetch: fetchMembers };
}

export function useGroupTasks(groupId: string | null) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<GroupTask[]>([]);

  const fetchTasks = useCallback(async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from('group_tasks')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    if (data) {
      setTasks(data.map((t: any) => ({
        id: t.id,
        groupId: t.group_id,
        title: t.title,
        assignedTo: t.assigned_to,
        completed: t.completed,
        createdBy: t.created_by,
        deadline: t.deadline,
      })));
    }
  }, [groupId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (title: string, assignedTo?: string, deadline?: string) => {
    if (!user || !groupId) return;
    await supabase.from('group_tasks').insert({
      group_id: groupId,
      title,
      assigned_to: assignedTo || null,
      created_by: user.id,
      deadline: deadline || null,
    } as any);
    await fetchTasks();
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await supabase.from('group_tasks').update({ completed: !task.completed }).eq('id', id);
    await fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('group_tasks').delete().eq('id', id);
    await fetchTasks();
  };

  return { tasks, addTask, toggleTask, deleteTask, refetch: fetchTasks };
}

export function useGroupMessages(groupId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    if (data) {
      const userIds = [...new Set(data.map((m: any) => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));

      setMessages(data.map((m: any) => ({
        id: m.id,
        groupId: m.group_id,
        userId: m.user_id,
        content: m.content,
        createdAt: m.created_at,
        displayName: profileMap.get(m.user_id) || undefined,
      })));
    }
  }, [groupId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!user || !groupId) return;
    await supabase.from('group_messages').insert({
      group_id: groupId,
      user_id: user.id,
      content,
    } as any);
    await fetchMessages();
  };

  return { messages, sendMessage, refetch: fetchMessages };
}

export function useGroupLinks(groupId: string | null) {
  const { user } = useAuth();
  const [links, setLinks] = useState<GroupLink[]>([]);

  const fetchLinks = useCallback(async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from('group_links')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (data) {
      setLinks(data.map((l: any) => ({
        id: l.id,
        groupId: l.group_id,
        userId: l.user_id,
        title: l.title,
        url: l.url,
        createdAt: l.created_at,
      })));
    }
  }, [groupId]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const addLink = async (title: string, url: string) => {
    if (!user || !groupId) return;
    await supabase.from('group_links').insert({
      group_id: groupId,
      user_id: user.id,
      title,
      url,
    } as any);
    await fetchLinks();
  };

  const deleteLink = async (id: string) => {
    await supabase.from('group_links').delete().eq('id', id);
    await fetchLinks();
  };

  return { links, addLink, deleteLink, refetch: fetchLinks };
}

export function useGroupPolls(groupId: string | null) {
  const { user } = useAuth();
  const [polls, setPolls] = useState<GroupPoll[]>([]);

  const fetchPolls = useCallback(async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from('group_polls')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (data) {
      setPolls(data.map((p: any) => ({
        id: p.id,
        groupId: p.group_id,
        question: p.question,
        options: p.options as string[],
        votes: (p.votes || {}) as Record<string, string>,
        createdBy: p.created_by,
        closed: p.closed,
      })));
    }
  }, [groupId]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  const createPoll = async (question: string, options: string[]) => {
    if (!user || !groupId) return;
    await supabase.from('group_polls').insert({
      group_id: groupId,
      question,
      options: options as any,
      created_by: user.id,
    } as any);
    await fetchPolls();
  };

  const vote = async (pollId: string, option: string) => {
    if (!user) return;
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    const newVotes = { ...poll.votes, [user.id]: option };
    await supabase.from('group_polls').update({ votes: newVotes as any }).eq('id', pollId);
    await fetchPolls();
  };

  const closePoll = async (pollId: string) => {
    await supabase.from('group_polls').update({ closed: true }).eq('id', pollId);
    await fetchPolls();
  };

  return { polls, createPoll, vote, closePoll, refetch: fetchPolls };
}
