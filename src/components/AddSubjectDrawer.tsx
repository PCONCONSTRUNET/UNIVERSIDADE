import { useState, useEffect } from 'react';
import { Subject, SUBJECT_COLORS, DAY_LABELS, ClassType } from '@/types/uniflow';
import SubjectColorPalette from '@/components/SubjectColorPalette';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddSubjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (subject: Subject) => void;
  defaultDay?: number;
}

const AddSubjectDrawer = ({ open, onOpenChange, onAdd, defaultDay }: AddSubjectDrawerProps) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ClassType>('presencial');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [professor, setProfessor] = useState('');
  const [location, setLocation] = useState('');
  const [workload, setWorkload] = useState('60');
  const [schedules, setSchedules] = useState([{ day: defaultDay ?? 1, startTime: '08:00', endTime: '09:40' }]);

  useEffect(() => {
    if (open && defaultDay !== undefined) {
      setSchedules(prev => prev.map((sch, i) => i === 0 ? { ...sch, day: defaultDay } : sch));
    }
  }, [open, defaultDay]);

  const addSchedule = () => setSchedules([...schedules, { day: 1, startTime: '08:00', endTime: '09:40' }]);
  const removeSchedule = (i: number) => setSchedules(schedules.filter((_, j) => j !== i));
  const updateSchedule = (i: number, field: string, value: any) => {
    const updated = [...schedules];
    (updated[i] as any)[field] = field === 'day' ? Number(value) : value;
    setSchedules(updated);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      id: Date.now().toString(),
      name: name.trim(),
      type,
      color,
      professor: professor.trim(),
      location: location.trim(),
      schedules,
      workload: Number(workload) || 60,
    });
    // Reset
    setName(''); setProfessor(''); setLocation(''); setWorkload('60');
    setSchedules([{ day: 1, startTime: '08:00', endTime: '09:40' }]);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Nova Disciplina</DrawerTitle>
          <DrawerDescription>Adicione uma disciplina ao seu cronograma</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input placeholder="Ex: Cálculo III" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={v => setType(v as ClassType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="hibrida">Híbrida</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Carga horária</Label>
              <Input type="number" value={workload} onChange={e => setWorkload(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <SubjectColorPalette value={color} onChange={setColor} />
          </div>

          <div className="space-y-2">
            <Label>Professor(a)</Label>
            <Input placeholder="Ex: Dr. Silva" value={professor} onChange={e => setProfessor(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Sala / Link</Label>
            <Input placeholder="Sala 204 ou link" value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          {/* Schedules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Horários</Label>
              <button onClick={addSchedule} className="text-xs text-primary flex items-center gap-0.5">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {schedules.map((sch, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-secondary p-2">
                <Select value={String(sch.day)} onValueChange={v => updateSchedule(i, 'day', v)}>
                  <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_LABELS.map((d, j) => (
                      <SelectItem key={j} value={String(j)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  value={sch.startTime}
                  onChange={e => updateSchedule(i, 'startTime', e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <Input
                  type="time"
                  value={sch.endTime}
                  onChange={e => updateSchedule(i, 'endTime', e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                {schedules.length > 1 && (
                  <button onClick={() => removeSchedule(i)} className="text-destructive">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim()}>
            Adicionar Disciplina
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddSubjectDrawer;
