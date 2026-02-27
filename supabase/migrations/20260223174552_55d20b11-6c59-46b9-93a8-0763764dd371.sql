
-- Materials table
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_path TEXT, -- storage path, null for links
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT, -- mime type
  url TEXT, -- external link (class link, video, etc)
  week_number INTEGER, -- week of semester
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own materials"
  ON public.materials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own materials"
  ON public.materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own materials"
  ON public.materials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own materials"
  ON public.materials FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for material files
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);

-- Storage RLS policies
CREATE POLICY "Users can upload own materials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own materials files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own materials files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);
