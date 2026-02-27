import { useState, useEffect } from 'react';
import { Activity, Subject, Priority, ActivityType, AiDifficulty } from '@/types/uniflow';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (activity: Activity) => void;
  subjects: Subject[];
}

const AddActivityDrawer = ({ open, onOpenChange, onAdd, subjects }: AddActivityDrawerProps) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<Priority>('media');
  const [activityType, setActivityType] = useState<ActivityType>('exercicio');
  const [weight, setWeight] = useState('1');
  const [grade, setGrade] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiReason, setAiReason] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty | undefined>(undefined);

  // Auto-analyze with AI when title, type, or subject changes
  useEffect(() => {
    if (!title.trim() || title.length < 3) {
      setAiReason('');
      return;
    }

    const timeout = setTimeout(async () => {
      setAiAnalyzing(true);
      setAiReason('');
      try {
        const subjectName = subjects.find(s => s.id === subjectId)?.name || '';
        const { data, error } = await supabase.functions.invoke('analyze-priority', {
          body: {
            title: title.trim(),
            activityType,
            subjectName,
            deadline: deadlineDate ? format(deadlineDate, 'yyyy-MM-dd') : 'não definido',
            weight: parseFloat(weight) || 1,
          },
        });

        if (error) throw error;

        if (data?.priority) {
          setPriority(data.priority as Priority);
          setAiDifficulty((data.difficulty as AiDifficulty) || undefined);
          setAiReason(data.reason || '');
        }
      } catch (err) {
        console.error('AI analysis error:', err);
      } finally {
        setAiAnalyzing(false);
      }
    }, 800); // debounce 800ms

    return () => clearTimeout(timeout);
  }, [title, activityType, subjectId, deadlineDate]);

  const handleSubmit = () => {
    if (!title.trim() || !deadlineDate) return;
    const deadline = format(deadlineDate, 'yyyy-MM-dd');
    onAdd({
      id: Date.now().toString(),
      title: title.trim(),
      subjectId,
      deadline,
      priority,
      status: 'pendente',
      activityType,
      weight: parseFloat(weight) || 1,
      grade: grade ? parseFloat(grade) : null,
      aiDifficulty,
    });
    setTitle(''); setDeadlineDate(undefined); setWeight('1'); setGrade(''); setAiReason(''); setAiDifficulty(undefined);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Nova Atividade</DrawerTitle>
          <DrawerDescription>Adicione uma tarefa ao seu cronograma</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder="Ex: Lista de exercícios 3" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Disciplina</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={activityType} onValueChange={v => setActivityType(v as ActivityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prova">Prova</SelectItem>
                <SelectItem value="trabalho">Trabalho</SelectItem>
                <SelectItem value="seminario">Seminário</SelectItem>
                <SelectItem value="exercicio">Exercício</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadlineDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadlineDate ? format(deadlineDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadlineDate}
                    onSelect={setDeadlineDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Prioridade</Label>
                {aiAnalyzing && <Loader2 size={12} className="animate-spin text-primary" />}
                {!aiAnalyzing && aiReason && <Sparkles size={12} className="text-primary" />}
              </div>
              <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
              {aiReason && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Sparkles size={10} className="text-primary shrink-0" />
                  {aiReason}
                </p>
              )}
            </div>
          </div>

          {/* Grade and Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Peso da avaliação</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nota <span className="text-muted-foreground text-[10px]">(opcional)</span></Label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="—"
                value={grade}
                onChange={e => setGrade(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!title.trim() || !deadlineDate}>
            Adicionar Atividade
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddActivityDrawer;
