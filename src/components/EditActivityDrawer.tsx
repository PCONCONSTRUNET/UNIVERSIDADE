import { useState, useEffect } from 'react';
import { Activity, Subject, Priority, ActivityType } from '@/types/uniflow';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EditActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  subjects: Subject[];
  onSave: (id: string, updates: Partial<Activity>) => void;
}

const EditActivityDrawer = ({ open, onOpenChange, activity, subjects, onSave }: EditActivityDrawerProps) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<Priority>('media');
  const [activityType, setActivityType] = useState<ActivityType>('exercicio');
  const [weight, setWeight] = useState('1');
  const [grade, setGrade] = useState('');
  const [description, setDescription] = useState('');

  // Populate form when activity changes
  useEffect(() => {
    if (activity && open) {
      setTitle(activity.title);
      setSubjectId(activity.subjectId);
      try {
        setDeadlineDate(parseISO(activity.deadline));
      } catch {
        setDeadlineDate(undefined);
      }
      setPriority(activity.priority);
      setActivityType(activity.activityType);
      setWeight(String(activity.weight ?? 1));
      setGrade(activity.grade != null ? String(activity.grade) : '');
      setDescription(activity.description || '');
    }
  }, [activity, open]);

  const handleSave = () => {
    if (!activity || !title.trim() || !deadlineDate) return;
    const deadline = format(deadlineDate, 'yyyy-MM-dd');
    onSave(activity.id, {
      title: title.trim(),
      subjectId,
      deadline,
      priority,
      activityType,
      weight: parseFloat(weight) || 1,
      grade: grade ? parseFloat(grade) : null,
      description: description.trim() || undefined,
    });
    onOpenChange(false);
  };

  if (!activity) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar Atividade</DrawerTitle>
          <DrawerDescription>Altere os dados da atividade</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
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
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
              <Label>Nota <span className="text-muted-foreground text-[10px]">(0 a 10)</span></Label>
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

          <div className="space-y-2">
            <Label>Descrição <span className="text-muted-foreground text-[10px]">(opcional)</span></Label>
            <Input
              placeholder="Detalhes adicionais..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} className="w-full gap-2" disabled={!title.trim() || !deadlineDate}>
            <Save size={16} />
            Salvar Alterações
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditActivityDrawer;
