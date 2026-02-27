import { useState, useMemo } from 'react';
import { Subject, Activity, ActivityType, Priority } from '@/types/uniflow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  CalendarIcon,
  ArrowRight,
  StickyNote,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';
import { format, parse, isValid, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface QuickClassNoteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  onSaveAsNote: (note: {
    title: string;
    content: string;
    category: string;
    pinned: boolean;
    subjectId: string | null;
  }) => void;
  onSaveAsActivity: (activity: Omit<Activity, 'id'>) => void;
}

/**
 * Parses dates from text like:
 * - "entregar dia 12" → day 12 of current/next month
 * - "prazo 15/06" → June 15
 * - "até dia 20" → day 20
 * - "dia 5 de março" → March 5
 */
function extractDate(text: string): { date: Date | null; label: string | null } {
  const lower = text.toLowerCase();

  const months: Record<string, number> = {
    janeiro: 0, fevereiro: 1, março: 2, marco: 2, abril: 3,
    maio: 4, junho: 5, julho: 6, agosto: 7,
    setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
  };

  // "dia 15 de março", "dia 5 de junho"
  const monthMatch = lower.match(/dia\s+(\d{1,2})\s+de\s+(\w+)/);
  if (monthMatch) {
    const day = parseInt(monthMatch[1]);
    const monthName = monthMatch[2];
    const month = months[monthName];
    if (month !== undefined && day >= 1 && day <= 31) {
      const now = new Date();
      let year = now.getFullYear();
      const d = new Date(year, month, day);
      if (d < now) d.setFullYear(year + 1);
      return { date: d, label: `${day} de ${monthMatch[2]}` };
    }
  }

  // "15/06" or "15/6"
  const slashMatch = lower.match(/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]) - 1;
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const now = new Date();
      let year = now.getFullYear();
      const d = new Date(year, month, day);
      if (d < now) d.setFullYear(year + 1);
      return { date: d, label: `${slashMatch[1]}/${slashMatch[2]}` };
    }
  }

  // "dia 12", "entregar dia 20", "até dia 5", "prazo dia 8"
  const dayMatch = lower.match(/dia\s+(\d{1,2})/);
  if (dayMatch) {
    const day = parseInt(dayMatch[1]);
    if (day >= 1 && day <= 31) {
      const now = new Date();
      let d = new Date(now.getFullYear(), now.getMonth(), day);
      if (d <= now) d = addMonths(d, 1);
      return { date: d, label: `dia ${day}` };
    }
  }

  return { date: null, label: null };
}

const QuickClassNote = ({
  open,
  onOpenChange,
  subjects,
  onSaveAsNote,
  onSaveAsActivity,
}: QuickClassNoteProps) => {
  const [text, setText] = useState('');
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [mode, setMode] = useState<'note' | 'task'>('note');
  const [activityType, setActivityType] = useState<ActivityType>('trabalho');
  const [priority, setPriority] = useState<Priority>('media');
  const { toast } = useToast();

  const detected = useMemo(() => extractDate(text), [text]);

  const handleSave = () => {
    if (!text.trim()) return;

    if (mode === 'note') {
      onSaveAsNote({
        title: text.trim().slice(0, 60) || 'Anotação rápida',
        content: text.trim(),
        category: 'Aula',
        pinned: false,
        subjectId: subjectId || null,
      });
      toast({
        title: '📝 Anotação salva!',
        description: 'Sua anotação de aula foi registrada.',
      });
    } else {
      const deadline = detected.date
        ? format(detected.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
      onSaveAsActivity({
        title: text.trim().slice(0, 80),
        subjectId: subjectId,
        deadline,
        priority,
        status: 'pendente',
        activityType,
        description: text.trim(),
      });
      toast({
        title: '✅ Tarefa criada!',
        description: detected.date
          ? `Prazo detectado: ${format(detected.date, "dd 'de' MMMM", { locale: ptBR })}`
          : 'Nenhuma data detectada — prazo definido como hoje.',
      });
    }

    setText('');
    setMode('note');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-amber-500" />
            Anotação Rápida de Aula
          </DialogTitle>
          <DialogDescription className="text-xs">
            Anote algo rápido e converta em tarefa se quiser
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subject */}
          {subjects.length > 0 && (
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Text input */}
          <div className="space-y-2">
            <Label>O que o professor falou?</Label>
            <Textarea
              placeholder='Ex: "Trabalho em grupo, entregar dia 12, sobre capítulo 5"'
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="resize-none"
              autoFocus
            />
          </div>

          {/* Detected date banner */}
          {detected.date && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
              <CalendarIcon className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">
                  📅 Data detectada: {format(detected.date, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Encontrado "{detected.label}" no texto
                </p>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-500/60" />
            </div>
          )}

          {/* Mode toggle */}
          <div className="space-y-2">
            <Label>Salvar como</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('note')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors border ${
                  mode === 'note'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border'
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                Anotação
              </button>
              <button
                type="button"
                onClick={() => setMode('task')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors border ${
                  mode === 'task'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                Tarefa
                {detected.date && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-600 border-0">
                    prazo detectado
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* Task-specific options */}
          {mode === 'task' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trabalho">Trabalho</SelectItem>
                    <SelectItem value="prova">Prova</SelectItem>
                    <SelectItem value="seminario">Seminário</SelectItem>
                    <SelectItem value="exercicio">Exercício</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSave}
            className="w-full"
            disabled={!text.trim() || (mode === 'task' && !subjectId)}
          >
            {mode === 'note' ? 'Salvar anotação' : 'Criar tarefa'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickClassNote;
