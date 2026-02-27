import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Material {
  id: string;
  subjectId: string | null;
  title: string;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  url: string | null;
  weekNumber: number | null;
  description: string | null;
  createdAt: string;
}

export function useMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setMaterials(data.map((m: any) => ({
        id: m.id,
        subjectId: m.subject_id,
        title: m.title,
        filePath: m.file_path,
        fileName: m.file_name,
        fileSize: m.file_size,
        fileType: m.file_type,
        url: m.url,
        weekNumber: m.week_number,
        description: m.description,
        createdAt: m.created_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const uploadFile = async (file: File, subjectId: string | null, title: string, weekNumber: number | null) => {
    if (!user) return;
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(filePath, file);
    if (uploadError) return { error: uploadError };

    const { error } = await supabase.from('materials').insert({
      user_id: user.id,
      subject_id: subjectId || null,
      title,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      week_number: weekNumber,
    } as any);
    if (!error) await fetchMaterials();
    return { error };
  };

  const addLink = async (title: string, url: string, subjectId: string | null, weekNumber: number | null) => {
    if (!user) return;
    const { error } = await supabase.from('materials').insert({
      user_id: user.id,
      subject_id: subjectId || null,
      title,
      url,
      week_number: weekNumber,
    } as any);
    if (!error) await fetchMaterials();
    return { error };
  };

  const deleteMaterial = async (material: Material) => {
    if (material.filePath) {
      await supabase.storage.from('materials').remove([material.filePath]);
    }
    await supabase.from('materials').delete().eq('id', material.id);
    await fetchMaterials();
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('materials').getPublicUrl(filePath);
    return data.publicUrl;
  };

  return { materials, loading, uploadFile, addLink, deleteMaterial, getPublicUrl, refetch: fetchMaterials };
}
