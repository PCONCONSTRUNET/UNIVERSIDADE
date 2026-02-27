
-- Create storage bucket for group files
INSERT INTO storage.buckets (id, name, public) VALUES ('group-files', 'group-files', true);

-- RLS policies: group members can upload files
CREATE POLICY "Group members can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'group-files'
  AND auth.uid() IS NOT NULL
);

-- RLS policies: group members can view files
CREATE POLICY "Group members can view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-files');

-- RLS policies: file owners can delete files
CREATE POLICY "File owners can delete group files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'group-files'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
