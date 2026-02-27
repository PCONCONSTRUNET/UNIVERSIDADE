import { useState, useRef } from 'react';
import { Subject } from '@/types/uniflow';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FolderOpen,
  Upload,
  Link2,
  Trash2,
  FileText,
  Image,
  Film,
  File,
  ExternalLink,
  Plus,
  Filter,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MaterialsViewProps {
  subjects: Subject[];
}

const FILE_ICONS: Record<string, React.ElementType> = {
  'application/pdf': FileText,
  'image/': Image,
  'video/': Film,
};

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  for (const [key, Icon] of Object.entries(FILE_ICONS)) {
    if (fileType.startsWith(key)) return Icon;
  }
  return File;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MaterialsView = ({ subjects }: MaterialsViewProps) => {
  const { toast } = useToast();
  const { materials, loading, uploadFile, addLink, deleteMaterial, getPublicUrl } = useMaterials();
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<'file' | 'link'>('file');
  const [filterSubject, setFilterSubject] = useState<string>('__all__');
  const [filterWeek, setFilterWeek] = useState<string>('__all__');

  // Add form state
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string>('__none__');
  const [weekNumber, setWeekNumber] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = materials.filter(m => {
    if (filterSubject !== '__all__' && m.subjectId !== filterSubject) return false;
    if (filterWeek !== '__all__' && String(m.weekNumber) !== filterWeek) return false;
    return true;
  });

  const weeks = [...new Set(materials.map(m => m.weekNumber).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0));

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setUploading(true);
    const sid = subjectId === '__none__' ? null : subjectId;
    const wk = weekNumber ? Number(weekNumber) : null;

    if (addMode === 'file' && selectedFile) {
      const result = await uploadFile(selectedFile, sid, title.trim(), wk);
      if (result?.error) {
        toast({ variant: 'destructive', title: 'Erro no upload', description: result.error.message });
      } else {
        toast({ title: '📁 Material enviado!' });
      }
    } else if (addMode === 'link' && linkUrl.trim()) {
      const result = await addLink(title.trim(), linkUrl.trim(), sid, wk);
      if (result?.error) {
        toast({ variant: 'destructive', title: 'Erro', description: result.error.message });
      } else {
        toast({ title: '🔗 Link salvo!' });
      }
    }

    setTitle('');
    setSubjectId('__none__');
    setWeekNumber('');
    setLinkUrl('');
    setSelectedFile(null);
    setShowAdd(false);
    setUploading(false);
  };

  const handleDelete = async (material: Material) => {
    await deleteMaterial(material);
    toast({ title: '🗑️ Material removido' });
  };

  const openMaterial = (material: Material) => {
    if (material.url) {
      window.open(material.url, '_blank');
    } else if (material.filePath) {
      window.open(getPublicUrl(material.filePath), '_blank');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-4">
        <div className="animate-pulse h-8 bg-muted rounded w-40" />
        <div className="animate-pulse h-32 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Materiais</h1>
        <p className="text-sm text-muted-foreground">PDFs, links e arquivos organizados</p>
      </motion.div>

      {/* Filters */}
      {materials.length > 0 && (
        <div className="flex gap-2">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="h-8 text-[10px] flex-1">
              <Filter size={10} className="mr-1" />
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas disciplinas</SelectItem>
              {subjects.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {weeks.length > 0 && (
            <Select value={filterWeek} onValueChange={setFilterWeek}>
              <SelectTrigger className="h-8 text-[10px] w-28">
                <SelectValue placeholder="Semana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas semanas</SelectItem>
                {weeks.map(w => (
                  <SelectItem key={w} value={String(w)}>Semana {w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-card p-4 shadow-sm space-y-3 border border-border/40">
              {/* Toggle file/link */}
              <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
                <button
                  onClick={() => setAddMode('file')}
                  className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold transition-colors ${
                    addMode === 'file' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <Upload size={12} /> Arquivo
                </button>
                <button
                  onClick={() => setAddMode('link')}
                  className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold transition-colors ${
                    addMode === 'link' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <Link2 size={12} /> Link
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px]">Título</Label>
                <Input placeholder="Ex: Slide aula 3" value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Disciplina</Label>
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhuma</SelectItem>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Semana</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 5"
                    value={weekNumber}
                    onChange={e => setWeekNumber(e.target.value)}
                    className="h-8 text-xs"
                    min={1}
                    max={20}
                  />
                </div>
              </div>

              {addMode === 'file' ? (
                <div className="space-y-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-16 border-dashed text-xs"
                  >
                    {selectedFile ? (
                      <span className="flex items-center gap-2">
                        <FileText size={16} />
                        <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                        <span className="text-muted-foreground">({formatSize(selectedFile.size)})</span>
                      </span>
                    ) : (
                      <span className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload size={18} />
                        Clique para selecionar arquivo
                      </span>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-[11px]">URL</Label>
                  <Input placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="h-8 text-xs" />
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!title.trim() || uploading || (addMode === 'file' ? !selectedFile : !linkUrl.trim())}
                  className="flex-1"
                >
                  {uploading ? 'Enviando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Materials list */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card p-8 text-center shadow-sm"
        >
          <FolderOpen className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-sm font-semibold mb-1">
            {materials.length === 0 ? 'Nenhum material ainda' : 'Nenhum resultado'}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {materials.length === 0
              ? 'Envie PDFs, slides e links de aula aqui'
              : 'Tente alterar os filtros'}
          </p>
          {materials.length === 0 && (
            <Button onClick={() => setShowAdd(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar material
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((material, idx) => {
            const subject = subjects.find(s => s.id === material.subjectId);
            const FileIcon = material.url ? Link2 : getFileIcon(material.fileType);
            return (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="rounded-2xl bg-card p-3 shadow-sm border border-border/40 flex items-center gap-3"
              >
                <button
                  onClick={() => openMaterial(material)}
                  className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-primary/10"
                >
                  <FileIcon size={18} className="text-primary" />
                </button>
                <div className="flex-1 min-w-0" onClick={() => openMaterial(material)}>
                  <p className="text-xs font-semibold truncate">{material.title}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    {subject && (
                      <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4" style={{ borderColor: subject.color, color: subject.color }}>
                        {subject.name}
                      </Badge>
                    )}
                    {material.weekNumber && (
                      <span className="text-[9px] text-muted-foreground">Sem. {material.weekNumber}</span>
                    )}
                    {material.fileSize && (
                      <span className="text-[9px] text-muted-foreground">{formatSize(material.fileSize)}</span>
                    )}
                    {material.url && (
                      <ExternalLink size={8} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(material)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add button */}
      {!showAdd && (
        <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full">
          <Plus className="w-4 h-4 mr-1" />
          Adicionar material
        </Button>
      )}
    </div>
  );
};

export default MaterialsView;
