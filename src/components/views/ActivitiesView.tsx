import { useState } from 'react';
import { Activity, Subject, ActivityType, AttendanceRecord } from '@/types/uniflow';
import { Plus, Calendar, Flag, AlertTriangle, FileText, Presentation, PenLine, Trash2, Star, LayoutGrid, List, Brain, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import EditActivityDrawer from '@/components/EditActivityDrawer';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import GradesSummary from '@/components/dashboard/GradesSummary';
import KanbanBoard from '@/components/KanbanBoard';
import { sortBySmartPriority, SmartPriority } from '@/lib/smartPriority';
import CompleteActivityDialog from '@/components/CompleteActivityDialog';

interface ActivitiesViewProps {
  activities: Activity[];
  subjects: Subject[];
  attendance?: AttendanceRecord[];
  onToggleStatus: (id: string, grade?: number | null) => void;
  onAddActivity: () => void;
  onDeleteActivity: (id: string) => void;
  onUpdateActivity?: (id: string, updates: Partial<Activity>) => void;
}

type Filter = 'todas' | 'pendente' | 'em_andamento' | 'concluido';
type ViewMode = 'list' | 'kanban';

const filterLabels: { id: Filter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendente', label: 'Pendentes' },
  { id: 'em_andamento', label: 'Em andamento' },
  { id: 'concluido', label: 'Concluídas' },
];

const priorityConfig = {
  alta: { label: 'Alta', className: 'bg-destructive/15 text-destructive' },
  media: { label: 'Média', className: 'bg-warning/15 text-warning' },
  baixa: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
};

const statusConfig = {
  pendente: { label: 'Pendente', className: 'bg-muted text-muted-foreground' },
  em_andamento: { label: 'Em andamento', className: 'bg-primary/15 text-primary' },
  concluido: { label: 'Concluída', className: 'bg-success/15 text-success' },
};

const activityTypeConfig: Record<ActivityType, { label: string; icon: React.ElementType; className: string }> = {
  prova: { label: 'Prova', icon: AlertTriangle, className: 'bg-destructive/15 text-destructive' },
  trabalho: { label: 'Trabalho', icon: FileText, className: 'bg-primary/15 text-primary' },
  seminario: { label: 'Seminário', icon: Presentation, className: 'bg-warning/15 text-warning' },
  exercicio: { label: 'Exercício', icon: PenLine, className: 'bg-success/15 text-success' },
};

const smartLevelConfig = {
  critical: { label: 'Urgente', className: 'bg-destructive/15 text-destructive animate-pulse' },
  high: { label: 'Alta', className: 'bg-orange-500/15 text-orange-600' },
  medium: { label: 'Média', className: 'bg-amber-500/15 text-amber-600' },
  low: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
};

const ActivitiesView = ({ activities, subjects, attendance = [], onToggleStatus, onAddActivity, onDeleteActivity, onUpdateActivity }: ActivitiesViewProps) => {
  const [filter, setFilter] = useState<Filter>('todas');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [smartSort, setSmartSort] = useState(true);
  const [completingActivity, setCompletingActivity] = useState<Activity | null>(null);

  const handleToggleStatus = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;
    // If going to concluido, show dialog; if uncompleting, just toggle
    if (activity.status !== 'concluido') {
      setCompletingActivity(activity);
    } else {
      onToggleStatus(id);
    }
  };

  const handleCompleteConfirm = (grade: number | null) => {
    if (completingActivity) {
      onToggleStatus(completingActivity.id, grade);
      setCompletingActivity(null);
    }
  };

  const filtered = filter === 'todas' ? activities : activities.filter(a => a.status === filter);
  const subFiltered = subjectFilter ? filtered.filter(a => a.subjectId === subjectFilter) : filtered;

  // Apply smart priority sorting
  const displayActivities = smartSort
    ? sortBySmartPriority(subFiltered, subjects, activities, attendance)
    : subFiltered.map(a => ({ ...a, smartPriority: undefined as any }));

  const getSubject = (id: string) => subjects.find(s => s.id === id);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const handleGradeSave = (activityId: string) => {
    if (onUpdateActivity && gradeInput) {
      onUpdateActivity(activityId, { grade: parseFloat(gradeInput) });
    }
    setEditingGrade(null);
    setGradeInput('');
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Atividades</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn('rounded-md p-1.5 transition-colors', viewMode === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn('rounded-md p-1.5 transition-colors', viewMode === 'kanban' ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
          <button
            onClick={onAddActivity}
            className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            <Plus size={14} />
            Nova
          </button>
        </div>
      </div>

      {/* Smart Priority Toggle */}
      <button
        onClick={() => setSmartSort(!smartSort)}
        className={cn(
          'flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-semibold transition-all w-full',
          smartSort
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'bg-muted/50 text-muted-foreground'
        )}
      >
        <Brain size={14} />
        <span>Prioridade Inteligente</span>
        <span className="ml-auto text-[9px] opacity-70">{smartSort ? 'ON' : 'OFF'}</span>
      </button>

      {/* Grades Summary */}
      <GradesSummary activities={activities} subjects={subjects} />

      {/* Subject filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setSubjectFilter(null)}
          className={cn(
            'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all',
            !subjectFilter ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
          )}
        >
          Todas
        </button>
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => setSubjectFilter(subjectFilter === s.id ? null : s.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1',
              subjectFilter === s.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
            )}
          >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </button>
        ))}
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          activities={subjectFilter ? activities.filter(a => a.subjectId === subjectFilter) : activities}
          subjects={subjects}
          onToggleStatus={handleToggleStatus}
          onDeleteActivity={onDeleteActivity}
          onUpdateActivity={onUpdateActivity}
          subjectFilter={subjectFilter}
          onEditActivity={setEditingActivity}
        />
      ) : (
        <>
          {/* List filter tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {filterLabels.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  filter === f.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Activity list */}
          <div className="space-y-2">
            {displayActivities.map((activity, i) => {
              const subject = getSubject(activity.subjectId);
              const priority = priorityConfig[activity.priority];
              const status = statusConfig[activity.status];

              return (
              <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: activity.status === 'concluido' ? 0.6 : 1,
                    y: 0,
                    scale: activity.status === 'concluido' ? 0.98 : 1,
                  }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                  className={cn(
                    'rounded-2xl bg-card p-4 shadow-sm transition-all duration-300',
                    activity.status === 'concluido' && 'bg-success/5 border border-success/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <motion.button
                      onClick={() => handleToggleStatus(activity.id)}
                      whileTap={{ scale: 0.8 }}
                      animate={activity.status === 'concluido' ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300',
                        activity.status === 'concluido'
                          ? 'border-success bg-success shadow-[0_0_8px_hsl(var(--success)/0.4)]'
                          : 'border-muted-foreground hover:border-primary'
                      )}
                    >
                      {activity.status === 'concluido' && (
                        <motion.svg
                          width="10" height="10" viewBox="0 0 10 10" fill="none"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          <motion.path
                            d="M2 5L4 7L8 3"
                            stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </motion.svg>
                      )}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium transition-all duration-300',
                        activity.status === 'concluido' && 'line-through text-muted-foreground decoration-success/50'
                      )}>
                        {activity.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5" style={{ color: subject?.color }}>
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: subject?.color }} />
                          {subject?.name}
                        </span>
                      </div>
                      {/* Smart Priority Badge */}
                      {smartSort && (activity as any).smartPriority && (activity as any).smartPriority.score > 0 && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold flex items-center gap-0.5 ${smartLevelConfig[(activity as any).smartPriority.level as keyof typeof smartLevelConfig].className}`}>
                            <Brain size={8} />
                            {(activity as any).smartPriority.score}pts — {(activity as any).smartPriority.label}
                          </span>
                          <span className="text-[8px] text-muted-foreground">{(activity as any).smartPriority.reason}</span>
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                        {(() => {
                          const typeConf = activityTypeConfig[activity.activityType];
                          const TypeIcon = typeConf.icon;
                          return (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-0.5 ${typeConf.className}`}>
                              <TypeIcon size={8} />{typeConf.label}
                            </span>
                          );
                        })()}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priority.className}`}>
                          <Flag size={8} className="inline mr-0.5" />{priority.label}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                          {status.label}
                        </span>
                        <span className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          <Calendar size={8} />{formatDate(activity.deadline)}
                        </span>

                        {/* Grade badge */}
                        {editingGrade === activity.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              className="h-6 w-16 text-[10px] px-1.5"
                              value={gradeInput}
                              onChange={e => setGradeInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleGradeSave(activity.id)}
                              onBlur={() => handleGradeSave(activity.id)}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingGrade(activity.id);
                              setGradeInput(activity.grade != null ? String(activity.grade) : '');
                            }}
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-0.5 transition-colors',
                              activity.grade != null
                                ? activity.grade >= 6 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                            )}
                          >
                            <Star size={8} />
                            {activity.grade != null ? activity.grade.toFixed(1) : 'Nota'}
                          </button>
                        )}

                        <button
                          onClick={() => setEditingActivity(activity)}
                          className="rounded-full p-1 text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors"
                        >
                          <Edit3 size={12} />
                        </button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="rounded-full p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors">
                              <Trash2 size={12} />
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
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {displayActivities.length === 0 && (
              <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
                <p className="text-muted-foreground text-sm">Nenhuma atividade encontrada</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Complete activity dialog */}
      <CompleteActivityDialog
        open={!!completingActivity}
        onOpenChange={(open) => { if (!open) setCompletingActivity(null); }}
        activityTitle={completingActivity?.title || ''}
        activityType={completingActivity?.activityType || 'trabalho'}
        onConfirm={handleCompleteConfirm}
      />

      {/* Edit activity drawer */}
      <EditActivityDrawer
        open={!!editingActivity}
        onOpenChange={(open) => { if (!open) setEditingActivity(null); }}
        activity={editingActivity}
        subjects={subjects}
        onSave={(id, updates) => {
          if (onUpdateActivity) onUpdateActivity(id, updates);
          setEditingActivity(null);
        }}
      />
    </div>
  );
};

export default ActivitiesView;
