import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Goal {
  id: string;
  type: string;
  targetValue: number;
  currentValue: number;
  subjectId: string | null;
  weekStart: string | null;
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) {
      setGoals(data.map(g => ({
        id: g.id,
        type: g.type,
        targetValue: Number(g.target_value),
        currentValue: Number(g.current_value),
        subjectId: g.subject_id,
        weekStart: g.week_start,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    if (!user) return;
    await supabase.from('goals').insert({
      user_id: user.id,
      type: goal.type,
      target_value: goal.targetValue,
      current_value: goal.currentValue,
      subject_id: goal.subjectId,
      week_start: goal.weekStart,
    });
    await fetch();
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const dbUpdates: any = {};
    if (updates.targetValue !== undefined) dbUpdates.target_value = updates.targetValue;
    if (updates.currentValue !== undefined) dbUpdates.current_value = updates.currentValue;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if ('subjectId' in updates) dbUpdates.subject_id = updates.subjectId;
    await supabase.from('goals').update(dbUpdates).eq('id', id);
    await fetch();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    await fetch();
  };

  return { goals, loading, addGoal, updateGoal, deleteGoal, refetch: fetch };
}
