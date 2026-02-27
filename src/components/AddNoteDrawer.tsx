import { useState, useEffect } from 'react';
import { Note, NoteFontSize, Subject } from '@/types/uniflow';
import ColorPalette from '@/components/ColorPalette';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, ListChecks, Bold, Italic, List, Trash2, Tag } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AddNoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, note: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  onDelete?: (id: string) => void;
  editingNote?: Note | null;
  subjects?: Subject[];
}

const FONT_SIZES: { value: NoteFontSize; label: string }[] = [
  { value: 'small', label: 'Pequeno' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Grande' },
];

const AddNoteDrawer = ({ open, onOpenChange, onAdd, onUpdate, onDelete, editingNote, subjects = [] }: AddNoteDrawerProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Estudo');
  const [pinned, setPinned] = useState(false);
  const [useChecklist, setUseChecklist] = useState(false);
  const [checklist, setChecklist] = useState<{ text: string; checked: boolean }[]>([]);
  const [newItem, setNewItem] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<NoteFontSize>('normal');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const isEditing = !!editingNote;

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setCategory(editingNote.category);
      setPinned(editingNote.pinned);
      setColor(editingNote.color || null);
      setFontSize(editingNote.fontSize || 'normal');
      setSubjectId(editingNote.subjectId || null);
      setTags(editingNote.tags || []);
      if (editingNote.checklist && editingNote.checklist.length > 0) {
        setUseChecklist(true);
        setChecklist(editingNote.checklist);
      } else {
        setUseChecklist(false);
        setChecklist([]);
      }
    } else {
      setTitle(''); setContent(''); setCategory('Estudo'); setPinned(false);
      setUseChecklist(false); setChecklist([]);
      setColor(null); setFontSize('normal'); setSubjectId(null);
      setTags([]);
    }
    setNewItem(''); setNewTag('');
  }, [editingNote, open]);

  const addChecklistItem = () => {
    if (!newItem.trim()) return;
    setChecklist(prev => [...prev, { text: newItem.trim(), checked: false }]);
    setNewItem('');
  };

  const removeChecklistItem = (index: number) => {
    setChecklist(prev => prev.filter((_, i) => i !== index));
  };

  const toggleChecklistItem = (index: number) => {
    setChecklist(prev => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
  };

  const insertFormatting = (prefix: string, suffix: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>('#note-content');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selected + suffix + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const addTag = () => {
    const t = newTag.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    setTags(prev => [...prev, t]);
    setNewTag('');
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleSubmit = () => {
    if (!title.trim()) return;
    const noteData = {
      title: title.trim(),
      content: content.trim(),
      category,
      pinned,
      checklist: useChecklist && checklist.length > 0 ? checklist : undefined,
      color,
      fontSize,
      subjectId,
      tags,
    };
    if (isEditing && onUpdate) {
      onUpdate(editingNote.id, noteData);
    } else {
      onAdd(noteData);
    }
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditing ? 'Editar Anotação' : 'Nova Anotação'}</DrawerTitle>
          <DrawerDescription>{isEditing ? 'Altere os dados da anotação' : 'Crie uma anotação personalizada'}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder="Ex: Resumo do capítulo 5" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Cor da nota</Label>
            <ColorPalette value={color} onChange={setColor} />
          </div>

          {/* Font size & Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tamanho do texto</Label>
              <Select value={fontSize} onValueChange={v => setFontSize(v as NoteFontSize)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Matéria</Label>
              <Select value={subjectId || '__none__'} onValueChange={v => setSubjectId(v === '__none__' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggle text vs checklist */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseChecklist(false)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${!useChecklist ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              Texto
            </button>
            <button
              type="button"
              onClick={() => setUseChecklist(true)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${useChecklist ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              <ListChecks size={12} />
              Checklist
            </button>
          </div>

          {!useChecklist ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conteúdo</Label>
                <div className="flex gap-1">
                  <button type="button" onClick={() => insertFormatting('**', '**')} className="p-1.5 rounded hover:bg-muted transition-colors" title="Negrito">
                    <Bold size={14} />
                  </button>
                  <button type="button" onClick={() => insertFormatting('*', '*')} className="p-1.5 rounded hover:bg-muted transition-colors" title="Itálico">
                    <Italic size={14} />
                  </button>
                  <button type="button" onClick={() => insertFormatting('\n- ', '')} className="p-1.5 rounded hover:bg-muted transition-colors" title="Lista">
                    <List size={14} />
                  </button>
                </div>
              </div>
              <Textarea id="note-content" placeholder="Use **negrito** e *itálico*..." value={content} onChange={e => setContent(e.target.value)} rows={4} />
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Itens da checklist</Label>
              {checklist.length > 0 && (
                <div className="space-y-2">
                  {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <Checkbox checked={item.checked} onCheckedChange={() => toggleChecklistItem(i)} />
                      <span className={`flex-1 text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
                      <button type="button" onClick={() => removeChecklistItem(i)} className="rounded-full p-0.5 text-muted-foreground hover:text-destructive transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Novo item..."
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
                  className="flex-1"
                />
                <Button type="button" size="icon" variant="outline" onClick={addChecklistItem} disabled={!newItem.trim()}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Tag size={12} /> Tags</Label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="rounded-full hover:bg-primary/20 p-0.5 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Ex: prova, resumo..."
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1"
              />
              <Button type="button" size="icon" variant="outline" onClick={addTag} disabled={!newTag.trim()}>
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input placeholder="Ex: Estudo" value={category} onChange={e => setCategory(e.target.value)} list="note-categories" />
              <datalist id="note-categories">
                <option value="Estudo" />
                <option value="Referência" />
                <option value="Pessoal" />
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Fixar nota</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch checked={pinned} onCheckedChange={setPinned} />
                <span className="text-sm text-muted-foreground">{pinned ? 'Fixada' : 'Não'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" className="flex-shrink-0">
                    <Trash2 size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir anotação?</AlertDialogTitle>
                    <AlertDialogDescription>"{editingNote.title}" será removida permanentemente.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { onDelete(editingNote.id); onOpenChange(false); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={handleSubmit} className="flex-1" disabled={!title.trim()}>
              {isEditing ? 'Salvar Alterações' : 'Adicionar Anotação'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddNoteDrawer;
