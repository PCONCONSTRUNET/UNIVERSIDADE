import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useGroupFiles(groupId: string | null) {
  const { user } = useAuth();

  const uploadFile = async (file: File): Promise<{ url: string; fileName: string; fileType: string; fileSize: number } | null> => {
    if (!user || !groupId) return null;

    const ext = file.name.split('.').pop();
    const path = `${groupId}/${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('group-files').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from('group-files').getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
  };

  return { uploadFile };
}
