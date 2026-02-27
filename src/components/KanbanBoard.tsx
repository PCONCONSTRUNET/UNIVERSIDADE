import { useState, useRef, useCallback } from 'react';
import { Activity, Subject, ActivityStatus, ActivityType, Subtask } from '@/types/uniflow';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Calendar, Flag, AlertTriangle, FileText, Presentation, PenLine, Trash2, Star, Plus, CheckSquare, Square, ChevronDown, ChevronUp, Sparkles, GripVertical, Edit3 } from 'lucide-react';
import CompleteActivityDialog from '@/components/CompleteActivityDialog';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface KanbanBoardProps {
  activities: Activity[];
  subjects: Subject[];
  onToggleStatus: (id: string, grade?: number | null) => void;
  onDeleteActivity: (id: string) => void;
  onUpdateActivity?: (id: string, updates: Partial<Activity>) => void;
  subjectFilter: string | null;
  onEditActivity?: (activity: Activity) => void;
}

const columns: { status: ActivityStatus; label: string; color: string; bg: string }[] = [
  { status: 'pendente', label: 'Pendente', color: 'text-muted-foreground', bg: 'bg-muted/50' },
  { status: 'em_andamento', label: 'Em Andamento', color: 'text-primary', bg: 'bg-primary/5' },
  { status: 'concluido', label: 'Concluído', color: 'text-success', bg: 'bg-success/5' },
];

const priorityConfig = {
  alta: { label: 'Alta', className: 'bg-destructive/15 text-destructive' },
  media: { label: 'Média', className: 'bg-warning/15 text-warning' },
  baixa: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
};

const activityTypeConfig: Record<ActivityType, { label: string; icon: React.ElementType; className: string }> = {
  prova: { label: 'Prova', icon: AlertTriangle, className: 'bg-destructive/15 text-destructive' },
  trabalho: { label: 'Trabalho', icon: FileText, className: 'bg-primary/15 text-primary' },
  seminario: { label: 'Seminário', icon: Presentation, className: 'bg-warning/15 text-warning' },
  exercicio: { label: 'Exercício', icon: PenLine, className: 'bg-success/15 text-success' },
};

const KanbanBoard = ({ activities, subjects, onToggleStatus, onDeleteActivity, onUpdateActivity, subjectFilter, onEditActivity }: KanbanBoardProps) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [completingActivity, setCompletingActivity] = useState<Activity | null>(null);
  const [pendingMoveTarget, setPendingMoveTarget] = useState<ActivityStatus | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ActivityStatus | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);

  // Touch drag state
  const touchDragRef = useRef<{
    id: string;
    startY: number;
    startX: number;
    isDragging: boolean;
    element: HTMLElement | null;
    ghost: HTMLElement | null;
  } | null>(null);

  const filtered = subjectFilter
    ? activities.filter(a => a.subjectId === subjectFilter)
    : activities;

  const getSubject = (id: string) => subjects.find(s => s.id === id);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const moveToStatus = (activityId: string, newStatus: ActivityStatus) => {
    if (newStatus === 'concluido') {
      const activity = activities.find(a => a.id === activityId);
      if (activity && activity.status !== 'concluido') {
        setCompletingActivity(activity);
        setPendingMoveTarget(newStatus);
        return;
      }
    }
    if (onUpdateActivity) {
      onUpdateActivity(activityId, { status: newStatus });
    }
  };

  const handleCompleteConfirm = (grade: number | null) => {
    if (completingActivity && onUpdateActivity) {
      const updates: Partial<Activity> = { status: 'concluido' };
      if (grade !== null) updates.grade = grade;
      onUpdateActivity(completingActivity.id, updates);
    }
    setCompletingActivity(null);
    setPendingMoveTarget(null);
  };

  const toggleSubtask = (activity: Activity, index: number) => {
    if (!onUpdateActivity || !activity.subtasks) return;
    const updated = [...activity.subtasks];
    updated[index] = { ...updated[index], checked: !updated[index].checked };
    onUpdateActivity(activity.id, { subtasks: updated });
  };

  const addSubtask = (activity: Activity) => {
    if (!onUpdateActivity || !newSubtask.trim()) return;
    const updated = [...(activity.subtasks || []), { text: newSubtask.trim(), checked: false }];
    onUpdateActivity(activity.id, { subtasks: updated });
    setNewSubtask('');
  };

  const removeSubtask = (activity: Activity, index: number) => {
    if (!onUpdateActivity || !activity.subtasks) return;
    const updated = activity.subtasks.filter((_, i) => i !== index);
    onUpdateActivity(activity.id, { subtasks: updated });
  };

  // --- HTML5 Drag handlers ---
  const handleDragStart = useCallback((e: React.DragEvent, activityId: string) => {
    setDraggedId(activityId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', activityId);
    // Make the drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedId(null);
    setDragOverColumn(null);
    setDragOverCardId(null);
    setDragOverPosition(null);
  }, []);

  const handleColumnDragOver = useCallback((e: React.DragEvent, status: ActivityStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  const handleColumnDragLeave = useCallback(() => {
    setDragOverColumn(null);
    setDragOverCardId(null);
    setDragOverPosition(null);
  }, []);

  const handleColumnDrop = useCallback((e: React.DragEvent, targetStatus: ActivityStatus) => {
    e.preventDefault();
    const activityId = e.dataTransfer.getData('text/plain');
    if (activityId && onUpdateActivity) {
      const activity = activities.find(a => a.id === activityId);
      if (activity && activity.status !== targetStatus) {
        if (targetStatus === 'concluido' && activity.status !== 'concluido') {
          setCompletingActivity(activity);
          setPendingMoveTarget(targetStatus);
        } else {
          onUpdateActivity(activityId, { status: targetStatus });
        }
      }
    }
    setDraggedId(null);
    setDragOverColumn(null);
    setDragOverCardId(null);
    setDragOverPosition(null);
  }, [activities, onUpdateActivity]);

  const handleCardDragOver = useCallback((e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverCardId(cardId);
    setDragOverPosition(e.clientY < midY ? 'above' : 'below');
  }, []);

  // --- Touch drag handlers ---
  const handleTouchStart = useCallback((e: React.TouchEvent, activityId: string) => {
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    touchDragRef.current = {
      id: activityId,
      startY: touch.clientY,
      startX: touch.clientX,
      isDragging: false,
      element,
      ghost: null,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const ref = touchDragRef.current;
    if (!ref) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - ref.startX);
    const dy = Math.abs(touch.clientY - ref.startY);

    // Start drag after 10px movement
    if (!ref.isDragging && (dx > 10 || dy > 10)) {
      ref.isDragging = true;
      setDraggedId(ref.id);
      if (ref.element) {
        ref.element.style.opacity = '0.4';
      }
    }

    if (ref.isDragging) {
      e.preventDefault();
      // Find which column we're over
      const columnElements = document.querySelectorAll('[data-kanban-column]');
      columnElements.forEach((colEl) => {
        const rect = colEl.getBoundingClientRect();
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          const status = colEl.getAttribute('data-kanban-column') as ActivityStatus;
          setDragOverColumn(status);
        }
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const ref = touchDragRef.current;
    if (!ref) return;

    if (ref.isDragging && dragOverColumn && onUpdateActivity) {
      const activity = activities.find(a => a.id === ref.id);
      if (activity && activity.status !== dragOverColumn) {
        if (dragOverColumn === 'concluido' && activity.status !== 'concluido') {
          setCompletingActivity(activity);
          setPendingMoveTarget(dragOverColumn);
        } else {
          onUpdateActivity(ref.id, { status: dragOverColumn });
        }
      }
    }

    if (ref.element) {
      ref.element.style.opacity = '1';
    }

    touchDragRef.current = null;
    setDraggedId(null);
    setDragOverColumn(null);
    setDragOverCardId(null);
    setDragOverPosition(null);
  }, [dragOverColumn, activities, onUpdateActivity]);

  return (
    <>
    <div className="space-y-4">
      {columns.map(col => {
        const colActivities = filtered.filter(a => a.status === col.status);
        const isDropTarget = dragOverColumn === col.status && draggedId !== null;

        return (
          <div
            key={col.status}
            className="space-y-2"
            data-kanban-column={col.status}
            onDragOver={(e) => handleColumnDragOver(e, col.status)}
            onDragLeave={handleColumnDragLeave}
            onDrop={(e) => handleColumnDrop(e, col.status)}
          >
            {/* Column Header */}
            <div className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200',
              col.bg,
              isDropTarget && 'ring-2 ring-primary/40 scale-[1.01]'
            )}>
              <div className={`h-2.5 w-2.5 rounded-full ${col.status === 'pendente' ? 'bg-muted-foreground' : col.status === 'em_andamento' ? 'bg-primary' : 'bg-success'}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                {col.label}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground font-medium">
                {colActivities.length}
              </span>
            </div>

            {/* Drop zone indicator when empty */}
            {colActivities.length === 0 ? (
              <div className={cn(
                'rounded-xl border border-dashed p-4 text-center transition-all duration-200',
                isDropTarget
                  ? 'border-primary/50 bg-primary/5 scale-[1.01]'
                  : 'border-border'
              )}>
                <p className="text-[10px] text-muted-foreground">
                  {isDropTarget ? 'Solte aqui' : 'Nenhuma tarefa'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {colActivities.map((activity, i) => {
                  const subject = getSubject(activity.subjectId);
                  const priority = priorityConfig[activity.priority];
                  const typeConf = activityTypeConfig[activity.activityType];
                  const TypeIcon = typeConf.icon;
                  const isExpanded = expandedCard === activity.id;
                  const subtasks = activity.subtasks || [];
                  const completedSubtasks = subtasks.filter(s => s.checked).length;
                  const isDragging = draggedId === activity.id;
                  const isCardDragOver = dragOverCardId === activity.id && draggedId !== activity.id;

                  return (
                    <div key={activity.id} className="relative">
                      {/* Drop indicator above */}
                      {isCardDragOver && dragOverPosition === 'above' && (
                        <div className="h-1 rounded-full bg-primary/60 mb-1 mx-2 animate-pulse" />
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{
                          opacity: isDragging ? 0.4 : activity.status === 'concluido' ? 0.65 : 1,
                          y: 0,
                          scale: isDragging ? 0.95 : activity.status === 'concluido' ? 0.98 : 1,
                        }}
                        transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e as any, activity.id)}
                        onDragEnd={(e) => handleDragEnd(e as any)}
                        onDragOver={(e) => handleCardDragOver(e as any, activity.id)}
                        onTouchStart={(e) => handleTouchStart(e, activity.id)}
                        onTouchMove={(e) => handleTouchMove(e)}
                        onTouchEnd={handleTouchEnd}
                        className={cn(
                          'rounded-2xl bg-card p-3 shadow-sm border border-border/50 cursor-grab active:cursor-grabbing transition-all duration-300',
                          isDragging && 'opacity-40 scale-95',
                          activity.status === 'concluido' && 'bg-success/5 border-success/20',
                        )}
                        style={{ borderLeftWidth: 3, borderLeftColor: activity.status === 'concluido' ? 'hsl(var(--success))' : subject?.color }}
                      >
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <GripVertical size={14} className="text-muted-foreground/40 flex-shrink-0 touch-none" />
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-medium transition-all duration-300', activity.status === 'concluido' && 'line-through text-muted-foreground decoration-success/50')}>
                                {activity.title}
                              </p>
                              <p className="text-[10px] mt-0.5" style={{ color: subject?.color }}>
                                {subject?.name}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedCard(isExpanded ? null : activity.id)}
                            className="text-muted-foreground p-0.5"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        {/* Badges */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium flex items-center gap-0.5 ${typeConf.className}`}>
                            <TypeIcon size={7} />{typeConf.label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${priority.className}`}>
                            {priority.label}
                          </span>
                          <span className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">
                            <Calendar size={7} />{formatDate(activity.deadline)}
                          </span>
                          {activity.grade != null && (
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${activity.grade >= 6 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                              <Star size={7} className="inline mr-0.5" />{activity.grade.toFixed(1)}
                            </span>
                          )}
                          {subtasks.length > 0 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <CheckSquare size={7} />{completedSubtasks}/{subtasks.length}
                            </span>
                          )}
                          {activity.aiDifficulty && (
                            <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[9px] font-medium flex items-center gap-0.5">
                              <Sparkles size={7} />IA
                            </span>
                          )}
                        </div>

                        {/* Subtasks progress bar */}
                        {subtasks.length > 0 && (
                          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }}
                            />
                          </div>
                        )}

                        {/* Expanded section */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 space-y-2 border-t border-border/50 pt-3"
                          >
                            {/* Move status buttons */}
                            <div className="flex gap-1.5">
                              {columns.filter(c => c.status !== activity.status).map(c => (
                                <button
                                  key={c.status}
                                  onClick={() => moveToStatus(activity.id, c.status)}
                                  className={`flex-1 rounded-lg py-1.5 text-[10px] font-medium border transition-colors ${c.bg} ${c.color} border-border/50 hover:opacity-80`}
                                >
                                  → {c.label}
                                </button>
                              ))}
                            </div>

                            {/* Edit button */}
                            {onEditActivity && (
                              <button
                                onClick={() => onEditActivity(activity)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
                              >
                                <Edit3 size={10} />
                                Editar Atividade
                              </button>
                            )}

                            {/* Subtasks */}
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Subtarefas</p>
                              {subtasks.map((sub, idx) => (
                                <div key={idx} className="flex items-center gap-2 group">
                                  <button onClick={() => toggleSubtask(activity, idx)}>
                                    {sub.checked
                                      ? <CheckSquare size={14} className="text-success" />
                                      : <Square size={14} className="text-muted-foreground" />
                                    }
                                  </button>
                                  <span className={cn('text-xs flex-1', sub.checked && 'line-through text-muted-foreground')}>
                                    {sub.text}
                                  </span>
                                  <button
                                    onClick={() => removeSubtask(activity, idx)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              ))}
                              <div className="flex items-center gap-1.5">
                                <Input
                                  className="h-7 text-xs"
                                  placeholder="Nova subtarefa..."
                                  value={expandedCard === activity.id ? newSubtask : ''}
                                  onChange={e => setNewSubtask(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && addSubtask(activity)}
                                />
                                <button
                                  onClick={() => addSubtask(activity)}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Delete */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="flex items-center gap-1 text-[10px] text-destructive hover:underline">
                                  <Trash2 size={10} /> Excluir atividade
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{activity.title}" será removida permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDeleteActivity(activity.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Drop indicator below */}
                      {isCardDragOver && dragOverPosition === 'below' && (
                        <div className="h-1 rounded-full bg-primary/60 mt-1 mx-2 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* Complete activity dialog */}
    <CompleteActivityDialog
      open={!!completingActivity}
      onOpenChange={(open) => { if (!open) { setCompletingActivity(null); setPendingMoveTarget(null); } }}
      activityTitle={completingActivity?.title || ''}
      activityType={completingActivity?.activityType || 'trabalho'}
      onConfirm={handleCompleteConfirm}
    />
    </>
  );
};

export default KanbanBoard;
