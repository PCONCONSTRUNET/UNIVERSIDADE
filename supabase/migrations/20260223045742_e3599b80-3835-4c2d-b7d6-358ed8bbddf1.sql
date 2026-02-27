
-- Add grade and weight fields to activities for the grading system
ALTER TABLE public.activities
ADD COLUMN grade numeric DEFAULT NULL,
ADD COLUMN weight numeric DEFAULT 1;

-- Create goals table for weekly/subject goals
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'weekly_hours', -- weekly_hours, subject_grade, general_grade, attendance
  target_value numeric NOT NULL DEFAULT 0,
  current_value numeric NOT NULL DEFAULT 0,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  week_start date, -- for weekly goals
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add profile fields for targets
ALTER TABLE public.profiles
ADD COLUMN course text DEFAULT NULL,
ADD COLUMN current_semester integer DEFAULT 1,
ADD COLUMN target_grade numeric DEFAULT 7.0,
ADD COLUMN target_attendance numeric DEFAULT 75,
ADD COLUMN weekly_hours_goal numeric DEFAULT 20;
