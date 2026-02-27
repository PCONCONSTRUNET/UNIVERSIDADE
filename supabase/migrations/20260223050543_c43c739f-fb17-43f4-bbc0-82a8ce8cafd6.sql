
-- Add subtasks (checklist) field to activities
ALTER TABLE public.activities
ADD COLUMN subtasks jsonb DEFAULT '[]'::jsonb;
