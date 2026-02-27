
ALTER TABLE public.notes
ADD COLUMN color text DEFAULT null,
ADD COLUMN font_size text DEFAULT 'normal',
ADD COLUMN subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL DEFAULT null;
