import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Subject, Activity, Note, AttendanceRecord, Schedule, Subtask } from '@/types/uniflow';
import { toast } from 'sonner';

export function useSubjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) {
      setSubjects(data.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type as Subject['type'],
        color: s.color,
        professor: s.professor,
        location: s.location,
        workload: s.workload,
        schedules: (s.schedules as any as Schedule[]) || [],
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('subjects').insert({
      user_id: user.id,
      name: subject.name,
      type: subject.type,
      color: subject.color,
      professor: subject.professor,
      location: subject.location,
      workload: subject.workload,
      schedules: subject.schedules as any,
    }).select().single();
    if (data && !error) {
      await fetch();
    }
    return { data, error };
  };

  const deleteSubject = async (id: string) => {
    await supabase.from('subjects').delete().eq('id', id);
    await fetch();
  };

  return { subjects, loading, addSubject, deleteSubject, refetch: fetch };
}

export function useActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('activities')
      .select('*')
      .order('deadline', { ascending: true });
    if (data) {
      setActivities(data.map(a => ({
        id: a.id,
        title: a.title,
        subjectId: a.subject_id,
        deadline: a.deadline,
        priority: a.priority as Activity['priority'],
        status: a.status as Activity['status'],
        activityType: a.activity_type as Activity['activityType'],
        description: a.description || undefined,
        grade: (a as any).grade ?? null,
        weight: (a as any).weight ?? 1,
        subtasks: ((a as any).subtasks as Subtask[]) || [],
        updatedAt: a.updated_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addActivity = async (activity: Omit<Activity, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('activities').insert({
      user_id: user.id,
      title: activity.title,
      subject_id: activity.subjectId,
      deadline: activity.deadline,
      priority: activity.priority,
      status: activity.status,
      activity_type: activity.activityType,
      description: activity.description,
      grade: activity.grade,
      weight: activity.weight ?? 1,
    } as any).select().single();
    if (!error) await fetch();
    return { data, error };
  };

  const toggleStatus = async (id: string, grade?: number | null) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;
    const newStatus = activity.status === 'concluido' ? 'pendente' : 'concluido';
    const updates: any = { status: newStatus };
    if (grade !== undefined && newStatus === 'concluido') {
      updates.grade = grade;
    }
    await supabase.from('activities').update(updates).eq('id', id);
    await fetch();
  };

  const deleteActivity = async (id: string) => {
    await supabase.from('activities').delete().eq('id', id);
    await fetch();
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.subtasks !== undefined) dbUpdates.subtasks = updates.subtasks;
    if (updates.subjectId !== undefined) dbUpdates.subject_id = updates.subjectId;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.activityType !== undefined) dbUpdates.activity_type = updates.activityType;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    await supabase.from('activities').update(dbUpdates).eq('id', id);
    await fetch();
  };

  return { activities, loading, addActivity, toggleStatus, deleteActivity, updateActivity, refetch: fetch };
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (data) {
      setNotes(data.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        pinned: n.pinned,
        category: n.category,
        checklist: n.checklist as Note['checklist'],
        createdAt: n.created_at,
        color: (n as any).color || null,
        fontSize: ((n as any).font_size || 'normal') as Note['fontSize'],
        subjectId: (n as any).subject_id || null,
        tags: (n as any).tags || [],
        sortOrder: (n as any).sort_order || 0,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addNote = async (note: Omit<Note, 'id' | 'createdAt'>) => {
    if (!user) return;
    await supabase.from('notes').insert({
      user_id: user.id,
      title: note.title,
      content: note.content,
      pinned: note.pinned,
      category: note.category,
      checklist: note.checklist as any,
      color: note.color || null,
      font_size: note.fontSize || 'normal',
      subject_id: note.subjectId || null,
      tags: note.tags || [],
      sort_order: note.sortOrder || 0,
    } as any);
    await fetch();
  };

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    await fetch();
  };

  const updateNote = async (id: string, note: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    if (!user) return;
    const dbUpdates: any = {};
    if (note.title !== undefined) dbUpdates.title = note.title;
    if (note.content !== undefined) dbUpdates.content = note.content;
    if (note.pinned !== undefined) dbUpdates.pinned = note.pinned;
    if (note.category !== undefined) dbUpdates.category = note.category;
    if (note.checklist !== undefined) dbUpdates.checklist = note.checklist;
    if (note.color !== undefined) dbUpdates.color = note.color;
    if (note.fontSize !== undefined) dbUpdates.font_size = note.fontSize;
    if (note.subjectId !== undefined) dbUpdates.subject_id = note.subjectId;
    if (note.tags !== undefined) dbUpdates.tags = note.tags;
    if (note.sortOrder !== undefined) dbUpdates.sort_order = note.sortOrder;
    await supabase.from('notes').update(dbUpdates).eq('id', id);
    await fetch();
  };
  const reorderNotes = async (reorderedNotes: Note[]) => {
    if (!user) return;
    // Optimistic update
    setNotes(reorderedNotes);
    // Batch update sort_order
    const updates = reorderedNotes.map((n, i) => 
      supabase.from('notes').update({ sort_order: i } as any).eq('id', n.id)
    );
    await Promise.all(updates);
  };

  return { notes, loading, addNote, deleteNote, updateNote, reorderNotes, refetch: fetch };
}

export function useAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });
    if (data) {
      setAttendance(data.map(r => ({
        subjectId: r.subject_id,
        date: r.date,
        present: r.present,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const markAttendance = async (subjectId: string, date: string, present: boolean) => {
    if (!user) return;
    try {
      // First try to find existing record
      const { data: existing, error: selectError } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', user.id)
        .eq('subject_id', subjectId)
        .eq('date', date)
        .maybeSingle();

      if (selectError) {
        console.error('Erro ao buscar frequência:', selectError);
        toast.error('Erro ao buscar registro de frequência');
        return;
      }

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('attendance')
          .update({ present })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error('Erro ao atualizar frequência:', updateError);
          toast.error('Erro ao salvar frequência');
          return;
        }
        toast.success(present ? 'Presença atualizada ✓' : 'Falta registrada');
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from('attendance').insert({
          user_id: user.id,
          subject_id: subjectId,
          date,
          present,
        });
        
        if (insertError) {
          console.error('Erro ao inserir frequência:', insertError);
          toast.error('Erro ao salvar frequência');
          return;
        }
        toast.success(present ? 'Presença registrada ✓' : 'Falta registrada');
      }
      await fetch();
    } catch (err) {
      console.error('Erro inesperado:', err);
      toast.error('Erro ao salvar frequência');
    }
  };

  return { attendance, loading, markAttendance, refetch: fetch };
}
