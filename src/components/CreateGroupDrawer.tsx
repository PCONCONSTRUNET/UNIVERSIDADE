import { useState } from 'react';
import { Subject } from '@/types/uniflow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CreateGroupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (group: { name: string; subjectId?: string; description?: string; deadline?: string }) => void;
  subjects: Subject[];
}

const CreateGroupDrawer = ({ open, onOpenChange, onCreate, subjects }: CreateGroupDrawerProps) => {
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState<string>('__none__');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      subjectId: subjectId === '__none__' ? undefined : subjectId,
      description: description.trim() || undefined,
      deadline: deadlineDate ? format(deadlineDate, 'yyyy-MM-dd') : undefined,
    });
    setName('');
    setSubjectId('__none__');
    setDescription('');
    setDeadlineDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-base">Criar Grupo</DialogTitle>
          <DialogDescription className="text-xs">Crie um grupo para organizar trabalhos em equipe</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do grupo</Label>
            <Input placeholder='Ex: "Trabalho de Constitucional"' value={name} onChange={e => setName(e.target.value)} className="text-[16px]" />
          </div>

          <div className="space-y-2">
            <Label>Disciplina</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
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

          <div className="space-y-2">
            <Label>Descrição <span className="text-muted-foreground text-[10px]">(opcional)</span></Label>
            <Textarea placeholder="Tema, objetivo..." value={description} onChange={e => setDescription(e.target.value)} rows={2} className="text-[16px]" />
          </div>

          <div className="space-y-2">
            <Label>Prazo do trabalho</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !deadlineDate && "text-muted-foreground")}
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

          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim()}>
            Criar Grupo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDrawer;
