import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AcademicStatus = 'calouro' | 'veterano';

export interface ProfileData {
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  course: string | null;
  currentSemester: number;
  targetGrade: number;
  targetAttendance: number;
  weeklyHoursGoal: number;
  academicStatus: AcademicStatus;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setProfile({
        displayName: data.display_name,
        email: data.email,
        avatarUrl: data.avatar_url,
        course: (data as any).course ?? null,
        currentSemester: (data as any).current_semester ?? 1,
        targetGrade: (data as any).target_grade ?? 7.0,
        targetAttendance: (data as any).target_attendance ?? 75,
        weeklyHoursGoal: (data as any).weekly_hours_goal ?? 20,
        academicStatus: (data as any).academic_status ?? 'calouro',
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.course !== undefined) dbUpdates.course = updates.course;
    if (updates.currentSemester !== undefined) dbUpdates.current_semester = updates.currentSemester;
    if (updates.targetGrade !== undefined) dbUpdates.target_grade = updates.targetGrade;
    if (updates.targetAttendance !== undefined) dbUpdates.target_attendance = updates.targetAttendance;
    if (updates.weeklyHoursGoal !== undefined) dbUpdates.weekly_hours_goal = updates.weeklyHoursGoal;
    if (updates.academicStatus !== undefined) dbUpdates.academic_status = updates.academicStatus;
    await supabase.from('profiles').update(dbUpdates).eq('user_id', user.id);
    await fetch();
  };

  return { profile, loading, updateProfile, refetch: fetch };
}
