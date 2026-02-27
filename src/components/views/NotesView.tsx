import { useState, useRef } from 'react';
import { Note, Subject } from '@/types/uniflow';
import { Pin, Plus, CheckSquare, FileText, Trash2, Tag, GripVertical, Eye, PenLine } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ViewNoteDrawer from '@/components/ViewNoteDrawer';

interface NotesViewProps {
  notes: Note[];
  subjects?: Subject[];
  onAddNote: () => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (note: Note) => void;
  onReorder?: (notes: Note[]) => void;
}

const categoryColors: Record<string, string> = {
  'Estudo': 'bg-primary/15 text-primary',
  'Referência': 'bg-accent/15 text-accent',
  'Pessoal': 'bg-warning/15 text-warning',
};

const fontSizeClasses = {
  small: { title: 'text-xs', body: 'text-[10px]' },
  normal: { title: 'text-sm', body: 'text-xs' },
  large: { title: 'text-base', body: 'text-sm' },
};

const renderRichText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('- ')) {
      return <div key={i} className="flex items-start gap-1"><span>•</span><span>{formatInline(line.slice(2))}</span></div>;
    }
    return <span key={i}>{formatInline(line)}{i < lines.length - 1 && <br />}</span>;
  });
};

const formatInline = (text: string) => {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) parts.push(<strong key={key++}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={key++}>{match[3]}</em>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
};

const NotesView = ({ notes, subjects = [], onAddNote, onDeleteNote, onEditNote, onReorder }: NotesViewProps) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const dragOverId = useRef<string | null>(null);

  // Collect all unique tags
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));

  // Filter by tag
  const filtered = activeTag ? notes.filter(n => n.tags?.includes(activeTag)) : notes;
  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  const getSubject = (id?: string | null) => subjects.find(s => s.id === id);

  // Drag handlers for reorder (touch + mouse)
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverId.current = id;
  };
  const handleDrop = () => {
    if (!draggedId || !dragOverId.current || draggedId === dragOverId.current || !onReorder) {
      setDraggedId(null);
      return;
    }
    const reordered = [...notes];
    const fromIndex = reordered.findIndex(n => n.id === draggedId);
    const toIndex = reordered.findIndex(n => n.id === dragOverId.current);
    if (fromIndex < 0 || toIndex < 0) { setDraggedId(null); return; }
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorder(reordered.map((n, i) => ({ ...n, sortOrder: i })));
    setDraggedId(null);
  };

  const renderNote = (note: Note, i: number) => {
    const fs = fontSizeClasses[note.fontSize || 'normal'];
    const subject = getSubject(note.subjectId);
    const baseColor = note.color || null;

    const getAccentStyle = (color: string | null) => {
      if (!color) return { bg: 'hsl(var(--primary) / 0.1)', border: 'hsl(var(--primary) / 0.2)', circle: 'hsl(var(--primary) / 0.15)' };
      return { bg: `${color}30`, border: `${color}50`, circle: `${color}44` };
    };
    const accent = getAccentStyle(baseColor);

    return (
      <motion.div
        key={note.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        draggable
        onDragStart={() => handleDragStart(note.id)}
        onDragOver={(e) => handleDragOver(e, note.id)}
        onDrop={handleDrop}
        onDragEnd={() => setDraggedId(null)}
        className={`relative rounded-2xl overflow-hidden cursor-pointer group touch-manipulation ${draggedId === note.id ? 'opacity-40 scale-95' : ''}`}
        onClick={() => setViewingNote(note)}
      >
        {/* Card background */}
        <div className="absolute inset-0" style={{ background: accent.bg }} />

        {/* Decorative circle */}
        <div
          className="absolute -top-8 -left-4 w-24 h-24 rounded-full transition-all duration-700 ease-out group-hover:w-32 group-hover:h-32 group-hover:-top-6 group-hover:left-[40%]"
          style={{ border: `28px solid ${accent.circle}` }}
        />
        <div className="absolute inset-0 group-hover:bg-foreground/[0.02] transition-colors" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1">
                <GripVertical size={12} className="text-muted-foreground/40 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                <h3 className={`${fs.title} font-bold text-foreground leading-tight`}>{note.title}</h3>
              </div>
              {note.pinned && <Pin size={14} className="text-primary flex-shrink-0 mt-0.5" />}
            </div>

            {subject && (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                <span className="text-[10px] text-muted-foreground truncate">{subject.name}</span>
              </div>
            )}

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {note.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    <Tag size={8} />{tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="text-[9px] text-muted-foreground">+{note.tags.length - 3}</span>
                )}
              </div>
            )}

            {note.checklist ? (
              <div className="mt-2 space-y-1.5">
                {note.checklist.slice(0, 4).map((item, j) => (
                  <div key={j} className={`flex items-center gap-2 ${fs.body}`}>
                    <CheckSquare size={12} className={item.checked ? 'text-success' : 'text-muted-foreground'} />
                    <span className={item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}>{item.text}</span>
                  </div>
                ))}
                {note.checklist.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">+{note.checklist.length - 4} itens</span>
                )}
              </div>
            ) : (
              <div className={`mt-2 ${fs.body} text-muted-foreground line-clamp-4`}>
                {renderRichText(note.content)}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-foreground/[0.04] px-2.5 py-1.5 -mx-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColors[note.category] || 'bg-muted text-muted-foreground'}`}>
              {note.category}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">
                {new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setViewingNote(note); }}
                className="rounded-full p-1 text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors"
                title="Visualizar"
              >
                <Eye size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEditNote(note); }}
                className="rounded-full p-1 text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors"
                title="Editar"
              >
                <PenLine size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }}
                className="rounded-full p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
                title="Excluir"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Anotações</h1>
        <button
          onClick={onAddNote}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Plus size={14} />
          Nova
        </button>
      </div>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveTag(null)}
            className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${!activeTag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            Todas
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex-shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${activeTag === tag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              <Tag size={10} />{tag}
            </button>
          ))}
        </div>
      )}

      {pinned.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Pin size={12} /> Fixadas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {pinned.map((note, i) => renderNote(note, i))}
          </div>
        </section>
      )}

      <section>
        {pinned.length > 0 && (
          <h2 className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <FileText size={12} /> Outras
          </h2>
        )}
        <div className="grid grid-cols-2 gap-3">
          {unpinned.map((note, i) => renderNote(note, i + pinned.length))}
        </div>
      </section>

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
          <p className="text-muted-foreground text-sm">
            {activeTag ? `Nenhuma anotação com a tag "${activeTag}"` : 'Nenhuma anotação criada'}
          </p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anotação?</AlertDialogTitle>
            <AlertDialogDescription>
              "{notes.find(n => n.id === confirmDeleteId)?.title}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirmDeleteId) { onDeleteNote(confirmDeleteId); setConfirmDeleteId(null); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View note drawer */}
      <ViewNoteDrawer
        open={!!viewingNote}
        onOpenChange={(open) => { if (!open) setViewingNote(null); }}
        note={viewingNote}
        subjects={subjects}
        onEdit={(note) => { setViewingNote(null); onEditNote(note); }}
      />
    </div>
  );
};

export default NotesView;
