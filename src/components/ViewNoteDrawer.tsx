import { Note, Subject } from '@/types/uniflow';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Pin, CheckSquare, Tag, PenLine } from 'lucide-react';

interface ViewNoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  subjects?: Subject[];
  onEdit: (note: Note) => void;
}

const fontSizeClasses = {
  small: { title: 'text-base', body: 'text-sm' },
  normal: { title: 'text-lg', body: 'text-base' },
  large: { title: 'text-xl', body: 'text-lg' },
};

const renderRichText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('- ')) {
      return <div key={i} className="flex items-start gap-2"><span className="text-muted-foreground">•</span><span>{formatInline(line.slice(2))}</span></div>;
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i}>{formatInline(line)}</p>;
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

const categoryColors: Record<string, string> = {
  'Estudo': 'bg-primary/15 text-primary',
  'Referência': 'bg-accent/15 text-accent',
  'Pessoal': 'bg-warning/15 text-warning',
};

const ViewNoteDrawer = ({ open, onOpenChange, note, subjects = [], onEdit }: ViewNoteDrawerProps) => {
  if (!note) return null;

  const fs = fontSizeClasses[note.fontSize || 'normal'];
  const subject = subjects.find(s => s.id === note.subjectId);
  const baseColor = note.color || null;

  const getAccentStyle = (color: string | null) => {
    if (!color) return { bg: 'hsl(var(--primary) / 0.08)', border: 'hsl(var(--primary) / 0.15)' };
    return { bg: `${color}18`, border: `${color}35` };
  };
  const accent = getAccentStyle(baseColor);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-2">
            {note.pinned && <Pin size={16} className="text-primary flex-shrink-0" />}
            <DrawerTitle className={fs.title}>{note.title}</DrawerTitle>
          </div>
          <DrawerDescription className="flex items-center gap-2 flex-wrap mt-1">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${categoryColors[note.category] || 'bg-muted text-muted-foreground'}`}>
              {note.category}
            </span>
            {subject && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }} />
                {subject.name}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 max-h-[65vh] overflow-y-auto">
          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {note.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <Tag size={10} />{tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{ background: accent.bg, borderLeft: `3px solid ${accent.border}` }}
          >
            {note.checklist && note.checklist.length > 0 ? (
              <div className="space-y-2.5">
                {note.checklist.map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 ${fs.body}`}>
                    <CheckSquare size={16} className={item.checked ? 'text-success flex-shrink-0' : 'text-muted-foreground flex-shrink-0'} />
                    <span className={item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}>{item.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${fs.body} text-foreground leading-relaxed space-y-1.5`}>
                {note.content ? renderRichText(note.content) : (
                  <p className="text-muted-foreground italic">Sem conteúdo</p>
                )}
              </div>
            )}
          </div>

          {/* Edit button */}
          <Button
            onClick={() => { onOpenChange(false); onEdit(note); }}
            className="w-full mt-4"
            variant="outline"
          >
            <PenLine size={16} className="mr-2" />
            Editar Anotação
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ViewNoteDrawer;
