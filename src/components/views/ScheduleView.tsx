import { useState, useMemo } from 'react';
import { Subject, Activity, DAY_LABELS_FULL } from '@/types/uniflow';
import { Plus, Clock, MapPin, FileText, AlertTriangle, BookOpen, Presentation, PenLine, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ScheduleViewProps {
  subjects: Subject[];
  activities: Activity[];
  onAddSubject: (selectedDay: number) => void;
  onDeleteSubject: (id: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

const activityTypeConfig = {
  prova: { label: 'Prova', icon: AlertTriangle, className: 'bg-destructive/15 text-destructive' },
  trabalho: { label: 'Trabalho', icon: FileText, className: 'bg-primary/15 text-primary' },
  seminario: { label: 'Seminário', icon: Presentation, className: 'bg-warning/15 text-warning' },
  exercicio: { label: 'Exercício', icon: PenLine, className: 'bg-success/15 text-success' },
};

const priorityConfig = {
  alta: { label: 'Alta', icon: AlertTriangle, className: 'bg-destructive/15 text-destructive border-destructive/30' },
  media: { label: 'Média', icon: BookOpen, className: 'bg-warning/15 text-warning border-warning/30' },
  baixa: { label: 'Baixa', icon: BookOpen, className: 'bg-muted text-muted-foreground border-border' },
};

const WEEKDAY_HEADERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

function getRelativeLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === -1) return 'Ontem';
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return '';
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const ScheduleView = ({ subjects, activities, onAddSubject, onDeleteSubject }: ScheduleViewProps) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const selectedDay = selectedDate.getDay();

  const monthDays = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const isToday = (day: number) => {
    return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(viewYear, viewMonth, day));
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Check if a day has classes
  const dayHasClasses = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    const dow = date.getDay();
    return subjects.some(s => s.schedules.some(sch => sch.day === dow));
  };

  const dayClasses = useMemo(() => {
    return subjects
      .flatMap(s => s.schedules.map(sch => ({ subject: s, schedule: sch })))
      .filter(({ schedule }) => schedule.day === selectedDay)
      .sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));
  }, [subjects, selectedDay]);

  const upcomingDeadlines = useMemo(() => {
    const selectedMs = selectedDate.getTime();
    return activities
      .filter(a => a.status !== 'concluido')
      .map(a => {
        const deadlineMs = new Date(a.deadline).getTime();
        const daysFromSelected = Math.ceil((deadlineMs - selectedMs) / (1000 * 60 * 60 * 24));
        const priorityWeight = { alta: 0, media: 1, baixa: 2 };
        const urgencyScore = daysFromSelected <= 0
          ? -100 + priorityWeight[a.priority]
          : daysFromSelected * 3 + priorityWeight[a.priority];
        return { ...a, daysFromSelected, urgencyScore };
      })
      .sort((a, b) => a.urgencyScore - b.urgencyScore);
  }, [activities, selectedDate]);

  const getPosition = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h - 7) * 60 + m;
  };

  const getDaysFromSelected = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: 'Atrasado!', urgent: true };
    if (diff === 0) return { text: 'Entrega hoje!', urgent: true };
    if (diff === 1) return { text: 'Amanhã!', urgent: true };
    if (diff <= 3) return { text: `Em ${diff} dias`, urgent: true };
    return { text: `Em ${diff} dias`, urgent: false };
  };

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  const relativeLabel = getRelativeLabel(selectedDate);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Cronograma</h1>
        <button
          onClick={() => onAddSubject(selectedDate.getDay())}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Plus size={14} />
          Disciplina
        </button>
      </div>

      {/* Inline Calendar */}
      <div className="rounded-2xl bg-card p-3 shadow-sm">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-secondary transition-colors">
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
          <h3 className="text-sm font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
          <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-secondary transition-colors">
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_HEADERS.map((h, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">{h}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {monthDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const selected = isSelected(day);
            const todayDay = isToday(day);
            const hasClasses = dayHasClasses(day);
            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-all',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : todayDay
                      ? 'bg-primary/15 text-primary font-bold'
                      : hasClasses
                        ? 'bg-accent/10 text-foreground hover:bg-secondary'
                        : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                {day}
                {hasClasses && !selected && (
                  <div className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date label */}
      <div className="text-center">
        {relativeLabel && <p className="text-lg font-bold">{relativeLabel}</p>}
        <p className="text-xs text-muted-foreground capitalize">
          {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Upcoming Deadlines Section */}
      {upcomingDeadlines.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <FileText size={12} />
            Provas & Trabalhos
          </h2>
          <div className="space-y-2">
            {upcomingDeadlines.map((activity, i) => {
              const subject = getSubjectById(activity.subjectId);
              const priority = priorityConfig[activity.priority];
              const remaining = getDaysFromSelected(activity.deadline);
              const typeConf = activityTypeConfig[activity.activityType];
              const TypeIcon = typeConf.icon;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{
                    opacity: activity.status === 'concluido' ? 0.55 : 1,
                    x: 0,
                    scale: activity.status === 'concluido' ? 0.97 : 1,
                  }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                  className={cn(
                    'rounded-2xl border bg-card p-3 shadow-sm transition-all duration-300',
                    activity.status === 'concluido'
                      ? 'border-success/20 bg-success/5'
                      : remaining.urgent ? 'border-destructive/30' : 'border-border'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 transition-all duration-300',
                      activity.status === 'concluido' ? 'bg-success/15 text-success' : typeConf.className
                    )}>
                      {activity.status === 'concluido' ? (
                        <motion.svg
                          width="16" height="16" viewBox="0 0 16 16" fill="none"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          <motion.path
                            d="M3 8L6.5 11.5L13 4.5"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.4, delay: 0.15 }}
                          />
                        </motion.svg>
                      ) : (
                        <TypeIcon size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-semibold truncate transition-all duration-300',
                        activity.status === 'concluido' && 'line-through text-muted-foreground decoration-success/50'
                      )}>
                        {activity.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: activity.status === 'concluido' ? 'hsl(var(--muted-foreground))' : subject?.color }}>
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: activity.status === 'concluido' ? 'hsl(var(--success))' : subject?.color }} />
                          {subject?.name}
                        </span>
                        <span className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                          activity.status === 'concluido' ? 'bg-success/15 text-success' : typeConf.className
                        )}>
                          {activity.status === 'concluido' ? 'Concluída ✓' : typeConf.label}
                        </span>
                        {activity.status !== 'concluido' && (
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priority.className}`}>
                            {priority.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      {activity.status === 'concluido' ? (
                        <span className="text-[10px] font-bold text-success">Feito ✓</span>
                      ) : (
                        <span className={cn(
                          'text-[10px] font-bold',
                          remaining.urgent ? 'text-destructive' : 'text-muted-foreground'
                        )}>
                          {remaining.text}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Timeline */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Clock size={12} />
          Aulas do dia
        </h2>
        <div className="relative overflow-y-auto rounded-2xl bg-card p-3 shadow-sm" style={{ height: 'calc(100vh - 520px)', minHeight: '250px' }}>
          <div className="relative" style={{ height: `${14 * 60}px` }}>
            {HOURS.map(h => (
              <div key={h} className="absolute left-0 right-0 flex items-start" style={{ top: `${(h - 7) * 60}px` }}>
                <span className="w-10 flex-shrink-0 text-[10px] text-muted-foreground -mt-1.5">{String(h).padStart(2, '0')}:00</span>
                <div className="flex-1 border-t border-dashed border-border" />
              </div>
            ))}

            <AnimatePresence mode="wait">
              {dayClasses.map(({ subject, schedule }, i) => {
                const top = getPosition(schedule.startTime);
                const height = getPosition(schedule.endTime) - top;
                return (
                  <motion.div
                    key={`${subject.id}-${i}-${selectedDay}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="absolute left-12 right-2 rounded-xl p-3 overflow-hidden"
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(height, 45)}px`,
                      backgroundColor: `${subject.color}18`,
                      borderLeft: `3px solid ${subject.color}`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-semibold truncate" style={{ color: subject.color }}>{subject.name}</p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors flex-shrink-0">
                            <Trash2 size={10} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir disciplina?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{subject.name}" e todas as atividades associadas serão removidas permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteSubject(subject.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Clock size={10} />{schedule.startTime}-{schedule.endTime}</span>
                      <span className="flex items-center gap-0.5"><MapPin size={10} />{subject.location}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {dayClasses.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Sem aulas neste dia</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScheduleView;
