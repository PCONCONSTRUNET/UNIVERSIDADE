import { useMemo, useEffect, useState } from 'react';
import { Subject, Activity, AttendanceRecord, Note, DAY_LABELS_FULL } from '@/types/uniflow';
import { Clock, MapPin, BookOpen, CheckCircle2, AlertTriangle, FileText, Presentation, Flame, ChevronDown, ChevronUp, TrendingUp, Target, Medal, BarChart3, Monitor, Wifi, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import DashboardPerformance from '@/components/dashboard/DashboardPerformance';
import DashboardGoals from '@/components/dashboard/DashboardGoals';
import DashboardAlerts from '@/components/dashboard/DashboardAlerts';
import AcademicScore, { useAcademicScore } from '@/components/dashboard/AcademicScore';
import DashboardGamification from '@/components/dashboard/DashboardGamification';
import HakiWidget from '@/components/dashboard/HakiWidget';
import RiskIndicator from '@/components/dashboard/RiskIndicator';
import WeeklyReport from '@/components/dashboard/WeeklyReport';

interface DashboardViewProps {
  subjects: Subject[];
  activities: Activity[];
  attendance?: AttendanceRecord[];
  notes?: Note[];
  onOpenChat?: () => void;
  displayName?: string | null;
  weeklyHoursGoal?: number;
}

const activityTypeIcons = {
  prova: AlertTriangle,
  trabalho: FileText,
  seminario: Presentation,
  exercicio: FileText,
};

const classTypeConfig: Record<string, { icon: any; label: string }> = {
  presencial: { icon: Building2, label: 'Presencial' },
  online: { icon: Monitor, label: 'Online' },
  hibrida: { icon: Wifi, label: 'Híbrida' },
};

// Collapsible section wrapper
const CollapsibleSection = ({ 
  id, title, icon: Icon, children, defaultOpen = false, badge 
}: { 
  id: string; title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode 
}) => {
  const storageKey = `dash_section_${id}`;
  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? saved === 'true' : defaultOpen;
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem(storageKey, String(next));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between mb-2 group"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Icon size={12} />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {badge}
          <div className="w-5 h-5 rounded-md bg-muted/50 grid place-items-center group-hover:bg-muted transition-colors">
            {open ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
          </div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

const DashboardView = ({ subjects, activities, attendance = [], notes = [], onOpenChat, displayName, weeklyHoursGoal = 20 }: DashboardViewProps) => {
  const { toast } = useToast();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayLabel = DAY_LABELS_FULL[dayOfWeek];
  const score = useAcademicScore(activities, attendance);

  // Critical alerts for toast notifications
  const criticalAlerts = useMemo(() => {
    return activities.filter(a => {
      if (a.status === 'concluido') return false;
      if (a.priority !== 'alta') return false;
      if (a.activityType !== 'prova' && a.activityType !== 'trabalho') return false;
      const hoursLeft = (new Date(a.deadline).getTime() - today.getTime()) / (1000 * 60 * 60);
      return hoursLeft <= 48 && hoursLeft >= -24;
    });
  }, [activities]);

  useEffect(() => {
    if (criticalAlerts.length > 0) {
      criticalAlerts.forEach((a, i) => {
        const hoursLeft = Math.ceil((new Date(a.deadline).getTime() - today.getTime()) / (1000 * 60 * 60));
        const subject = subjects.find(s => s.id === a.subjectId);
        setTimeout(() => {
          toast({
            variant: 'destructive',
            title: `⚠️ ${a.activityType === 'prova' ? 'Prova' : 'Trabalho'} em ${hoursLeft <= 0 ? 'atraso!' : hoursLeft + 'h!'}`,
            description: `${a.title} — ${subject?.name}`,
          });
        }, 500 + i * 1200);
      });
    }
  }, []);

  const todayClasses = useMemo(() => {
    return subjects
      .flatMap(s => s.schedules.map(sch => ({ subject: s, schedule: sch })))
      .filter(({ schedule }) => schedule.day === dayOfWeek)
      .sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));
  }, [subjects, dayOfWeek]);

  const pendingActivities = activities.filter(a => a.status !== 'concluido');

  const formatDate = () => {
    return today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getDeadlineBadge = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: 'Atrasada', className: 'bg-destructive/15 text-destructive' };
    if (diff <= 2) return { text: `${diff}d`, className: 'bg-warning/15 text-warning' };
    return { text: `${diff}d`, className: 'bg-muted text-muted-foreground' };
  };

  const getSubjectById = (id: string) => subjects.find(s => s.id === id);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.04 },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  };

  return (
    <motion.div
      className="space-y-5 pb-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header — premium gradient text */}
      <motion.div variants={sectionVariants}>
        <p className="text-xs text-muted-foreground font-medium">{dayLabel}, {formatDate()}</p>
        <h1 className="text-2xl font-black tracking-tight mt-0.5">
          Olá, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{displayName || 'estudante'}</span>! 👋
        </h1>
      </motion.div>

      {/* 🤖 Haki Widget — always visible, primary CTA */}
      <motion.div variants={sectionVariants}>
        <HakiWidget
          subjects={subjects}
          activities={activities}
          attendance={attendance}
          academicScore={score.total}
          onOpenChat={onOpenChat}
        />
      </motion.div>

      {/* 🔥 Critical deadline alerts — always visible when present */}
      {criticalAlerts.length > 0 && (
        <motion.section variants={sectionVariants}>
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-destructive uppercase tracking-wider">
            <Flame size={12} /> Prazo Crítico
          </h2>
          <div className="space-y-2">
            {criticalAlerts.map(activity => {
              const subject = subjects.find(s => s.id === activity.subjectId);
              const hoursLeft = Math.ceil((new Date(activity.deadline).getTime() - today.getTime()) / (1000 * 60 * 60));
              const TypeIcon = activityTypeIcons[activity.activityType];
              return (
                <motion.div
                  key={activity.id}
                  animate={{ x: [0, -3, 3, -2, 2, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-center gap-3 rounded-3xl border border-destructive/40 bg-destructive/5 p-3 shadow-sm shadow-destructive/5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/15 flex-shrink-0">
                    <TypeIcon size={20} className="text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{subject?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-destructive">
                      {hoursLeft <= 0 ? '⏰' : `${hoursLeft}h`}
                    </p>
                    <p className="text-[9px] text-destructive/70 font-medium">
                      {hoursLeft <= 0 ? 'ATRASADO' : 'restantes'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* 🚨 Risk + Score — compact row, always visible */}
      <motion.div variants={sectionVariants}>
        <div className="grid grid-cols-1 gap-3">
          {subjects.length > 0 && <RiskIndicator subjects={subjects} activities={activities} attendance={attendance} />}
        </div>
      </motion.div>

      {/* 📊 Weekly Report + Score — always visible hero section */}
      <motion.div variants={sectionVariants}>
        <WeeklyReport subjects={subjects} activities={activities} attendance={attendance} />
      </motion.div>

      {/* 🏆 Score Acadêmico — compact inline */}
      <motion.div variants={sectionVariants}>
        <AcademicScore subjects={subjects} activities={activities} attendance={attendance} />
      </motion.div>

      {/* ⚠️ Smart Alerts — always visible when there are alerts */}
      <motion.div variants={sectionVariants}>
        <DashboardAlerts subjects={subjects} activities={activities} attendance={attendance} />
      </motion.div>

      {/* 📅 Today's Classes — collapsible */}
      <CollapsibleSection id="today_classes" title="Aulas de Hoje" icon={Clock} defaultOpen={todayClasses.length > 0}
        badge={
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {todayClasses.length}
          </span>
        }
      >
        {todayClasses.length === 0 ? (
           <div className="rounded-3xl bg-gradient-to-br from-success/5 to-accent/5 border border-success/10 p-5 text-center">
            <p className="text-muted-foreground text-sm">Nenhuma aula hoje 🎉</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {todayClasses.map(({ subject, schedule }, i) => {
              const typeConfig = classTypeConfig[subject.type] || classTypeConfig.presencial;
              const TypeIcon = typeConfig.icon;
              return (
                <motion.div
                  key={`${subject.id}-${i}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                  className="min-w-[210px] flex-shrink-0 rounded-3xl p-4 shadow-md hover:shadow-lg transition-all relative overflow-hidden group"
                  style={{
                    background: `linear-gradient(135deg, ${subject.color}18 0%, ${subject.color}08 50%, transparent 100%)`,
                    border: `1px solid ${subject.color}25`,
                  }}
                >
                  {/* Decorative glow */}
                  <div
                    className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity"
                    style={{ backgroundColor: subject.color }}
                  />

                  {/* Type badge + icon */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                    >
                      <TypeIcon size={10} />
                      {typeConfig.label}
                    </span>
                    <div
                      className="w-7 h-7 rounded-xl grid place-items-center"
                      style={{ backgroundColor: `${subject.color}15` }}
                    >
                      <BookOpen size={14} style={{ color: subject.color }} />
                    </div>
                  </div>

                  {/* Subject info */}
                  <p className="font-bold text-sm leading-tight">{subject.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{subject.professor}</p>

                  {/* Schedule + location */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={11} style={{ color: subject.color }} />
                      <span className="font-medium">{schedule.startTime} – {schedule.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin size={11} style={{ color: subject.color }} />
                      <span className="truncate">{subject.location}</span>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${subject.color}, transparent)` }}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      {/* 📝 Próximas Atividades — collapsible */}
      <CollapsibleSection id="pending_tasks" title="Próximas Atividades" icon={CheckCircle2} defaultOpen={pendingActivities.length > 0}
        badge={
          pendingActivities.length > 0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
              {pendingActivities.length}
            </span>
          ) : undefined
        }
      >
        <div className="space-y-2">
          {pendingActivities.slice(0, 4).map((activity, i) => {
            const subject = getSubjectById(activity.subjectId);
            const badge = getDeadlineBadge(activity.deadline);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="flex items-center gap-3 rounded-3xl bg-card p-3 shadow-sm border border-border/30 hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: subject?.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{subject?.name}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                  {badge.text}
                </span>
              </motion.div>
            );
          })}
          {pendingActivities.length === 0 && (
            <div className="rounded-3xl bg-gradient-to-br from-success/5 to-accent/5 border border-success/10 p-5 text-center">
              <CheckCircle2 className="mx-auto mb-2 text-success" size={24} />
              <p className="text-muted-foreground text-sm">Tudo em dia!</p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* 🎮 Gamification — collapsible */}
      <CollapsibleSection id="gamification" title="Gamificação" icon={Medal} defaultOpen={false}>
        <DashboardGamification activities={activities} attendance={attendance} academicScore={score.total} notes={notes} />
      </CollapsibleSection>

      {/* 📈 Performance — collapsible */}
      <CollapsibleSection id="performance" title="Performance Geral" icon={TrendingUp} defaultOpen={false}>
        <DashboardPerformance subjects={subjects} activities={activities} attendance={attendance} />
      </CollapsibleSection>

      {/* 🎯 Goals — collapsible */}
      <CollapsibleSection id="goals" title="Metas da Semana" icon={Target} defaultOpen={false}>
        <DashboardGoals subjects={subjects} activities={activities} weeklyHoursGoal={weeklyHoursGoal} />
      </CollapsibleSection>
    </motion.div>
  );
};

export default DashboardView;
