import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Course {
  id: string;
  name: string;
  currentSemester: number;
  weeklyHours: number;
  targetGrade: number;
  targetAttendance: number;
}

export function useCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('courses' as any)
      .select('*')
      .order('created_at', { ascending: true });
    if (data) {
      setCourses((data as any[]).map(c => ({
        id: c.id,
        name: c.name,
        currentSemester: c.current_semester,
        weeklyHours: Number(c.weekly_hours),
        targetGrade: Number(c.target_grade),
        targetAttendance: Number(c.target_attendance),
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addCourse = async (course: Omit<Course, 'id'>) => {
    if (!user) return;
    await (supabase.from('courses' as any) as any).insert({
      user_id: user.id,
      name: course.name,
      current_semester: course.currentSemester,
      weekly_hours: course.weeklyHours,
      target_grade: course.targetGrade,
      target_attendance: course.targetAttendance,
    });
    await fetch();
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.currentSemester !== undefined) dbUpdates.current_semester = updates.currentSemester;
    if (updates.weeklyHours !== undefined) dbUpdates.weekly_hours = updates.weeklyHours;
    if (updates.targetGrade !== undefined) dbUpdates.target_grade = updates.targetGrade;
    if (updates.targetAttendance !== undefined) dbUpdates.target_attendance = updates.targetAttendance;
    await (supabase.from('courses' as any) as any).update(dbUpdates).eq('id', id);
    await fetch();
  };

  const deleteCourse = async (id: string) => {
    await (supabase.from('courses' as any) as any).delete().eq('id', id);
    await fetch();
  };

  return { courses, loading, addCourse, updateCourse, deleteCourse, refetch: fetch };
}
