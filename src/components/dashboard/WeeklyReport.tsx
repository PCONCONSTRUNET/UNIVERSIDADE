import { useMemo } from 'react';
import { Subject, Activity, AttendanceRecord } from '@/types/uniflow';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, Clock, BarChart3, CalendarCheck } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, subWeeks, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface WeeklyReportProps {
  subjects: Subject[];
  activities: Activity[];
  attendance: AttendanceRecord[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.25 + i * 0.08,
      duration: 0.55,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const WeeklyReport = ({ subjects, activities, attendance }: WeeklyReportProps) => {
  const report = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);

    const inRange = (dateStr: string, start: Date, end: Date) => {
      try {
        return isWithinInterval(new Date(dateStr), { start, end });
      } catch { return false; }
    };

    const tasksThisWeek = activities.filter(a => a.status === 'concluido' && inRange(a.deadline, thisWeekStart, thisWeekEnd)).length;
    const tasksLastWeek = activities.filter(a => a.status === 'concluido' && inRange(a.deadline, lastWeekStart, lastWeekEnd)).length;

    const attThisWeek = attendance.filter(r => inRange(r.date, thisWeekStart, thisWeekEnd));
    const attLastWeek = attendance.filter(r => inRange(r.date, lastWeekStart, lastWeekEnd));
    const presentThisWeek = attThisWeek.filter(r => r.present).length;
    const presentLastWeek = attLastWeek.filter(r => r.present).length;

    const hoursThisWeek = attThisWeek
      .filter(r => r.present)
      .reduce((acc, r) => {
        const subject = subjects.find(s => s.id === r.subjectId);
        if (!subject) return acc;
        const daySchedules = subject.schedules.filter(sch => {
          const date = new Date(r.date);
          return sch.day === date.getDay();
        });
        const hours = daySchedules.reduce((h, sch) => {
          const [sh, sm] = sch.startTime.split(':').map(Number);
          const [eh, em] = sch.endTime.split(':').map(Number);
          return h + (eh + em / 60) - (sh + sm / 60);
        }, 0);
        return acc + (hours || 1.5);
      }, 0);

    const hoursLastWeek = attLastWeek
      .filter(r => r.present)
      .reduce((acc, r) => {
        const subject = subjects.find(s => s.id === r.subjectId);
        if (!subject) return acc;
        const daySchedules = subject.schedules.filter(sch => {
          const date = new Date(r.date);
          return sch.day === date.getDay();
        });
        const hours = daySchedules.reduce((h, sch) => {
          const [sh, sm] = sch.startTime.split(':').map(Number);
          const [eh, em] = sch.endTime.split(':').map(Number);
          return h + (eh + em / 60) - (sh + sm / 60);
        }, 0);
        return acc + (hours || 1.5);
      }, 0);

    const gradedActivities = activities.filter(a => a.grade != null && a.grade !== undefined);
    const avgGrade = gradedActivities.length > 0
      ? gradedActivities.reduce((s, a) => s + (a.grade || 0), 0) / gradedActivities.length
      : null;

    const pendingCount = activities.filter(a => a.status !== 'concluido').length;
    const overdueCount = activities.filter(a => a.status !== 'concluido' && new Date(a.deadline) < now).length;

    return {
      tasksThisWeek,
      tasksDiff: tasksThisWeek - tasksLastWeek,
      hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
      hoursDiff: Math.round((hoursThisWeek - hoursLastWeek) * 10) / 10,
      presentThisWeek,
      attendanceDiff: presentThisWeek - presentLastWeek,
      avgGrade,
      pendingCount,
      overdueCount,
      weekLabel: `${format(thisWeekStart, "dd/MM", { locale: ptBR })} — ${format(thisWeekEnd, "dd/MM", { locale: ptBR })}`,
    };
  }, [subjects, activities, attendance]);

  const TrendIcon = ({ diff }: { diff: number }) => {
    if (diff > 0) return <TrendingUp size={12} className="text-emerald-500" />;
    if (diff < 0) return <TrendingDown size={12} className="text-destructive" />;
    return <Minus size={12} className="text-muted-foreground" />;
  };

  const trendText = (diff: number, unit?: string) => {
    if (diff === 0) return 'igual';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff}${unit || ''} vs semana anterior`;
  };

  // Animated counters
  const animHours = useAnimatedCounter(report.hoursThisWeek, 1200, 1);
  const animTasks = useAnimatedCounter(report.tasksThisWeek, 1000);
  const animPresent = useAnimatedCounter(report.presentThisWeek, 1100);
  const animGrade = useAnimatedCounter(report.avgGrade ?? 0, 1300, 1);

  const stats = [
    {
      icon: Clock,
      label: 'Horas estudadas',
      value: `${animHours}h`,
      rawValue: report.hoursThisWeek,
      diff: report.hoursDiff,
      unit: 'h',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: CheckCircle2,
      label: 'Tarefas concluídas',
      value: animTasks,
      rawValue: report.tasksThisWeek,
      diff: report.tasksDiff,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: CalendarCheck,
      label: 'Presenças',
      value: animPresent,
      rawValue: report.presentThisWeek,
      diff: report.attendanceDiff,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
    },
    {
      icon: BarChart3,
      label: 'Média geral',
      value: report.avgGrade !== null ? animGrade : '—',
      rawValue: report.avgGrade ?? 0,
      diff: 0,
      hidetrend: report.avgGrade === null,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="flex items-center justify-between mb-3"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 size={12} /> Relatório Semanal
        </h2>
        <span className="text-[9px] text-muted-foreground">{report.weekLabel}</span>
      </motion.div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            custom={idx}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, y: -2 }}
            className="rounded-3xl bg-card p-3 shadow-sm border border-border/30 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                className={`w-7 h-7 rounded-lg grid place-items-center ${stat.bgColor}`}
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.35 + idx * 0.08, type: 'spring', damping: 12 }}
              >
                <stat.icon size={14} className={stat.color} />
              </motion.div>
              <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
            </div>
            <p className="text-xl font-black tabular-nums">{stat.value}</p>
            {!(stat as any).hidetrend && (
              <motion.div
                className="flex items-center gap-1 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + idx * 0.08 }}
              >
                <TrendIcon diff={stat.diff} />
                <span className="text-[9px] text-muted-foreground">{trendText(stat.diff, stat.unit)}</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Alerts row */}
      {(report.overdueCount > 0 || report.pendingCount > 0) && (
        <motion.div
          className="mt-2 flex gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {report.overdueCount > 0 && (
            <motion.div
              className="flex-1 rounded-2xl bg-destructive/10 px-3 py-2 flex items-center gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.75, type: 'spring', damping: 15 }}
            >
              <span className="text-destructive text-lg font-black tabular-nums">{report.overdueCount}</span>
              <span className="text-[10px] text-destructive/80 font-medium">tarefa{report.overdueCount !== 1 ? 's' : ''} atrasada{report.overdueCount !== 1 ? 's' : ''}</span>
            </motion.div>
          )}
          {report.pendingCount > 0 && (
            <motion.div
              className="flex-1 rounded-2xl bg-amber-500/10 px-3 py-2 flex items-center gap-2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, type: 'spring', damping: 15 }}
            >
              <span className="text-amber-600 text-lg font-black tabular-nums">{report.pendingCount}</span>
              <span className="text-[10px] text-amber-600/80 font-medium">pendente{report.pendingCount !== 1 ? 's' : ''}</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.section>
  );
};

export default WeeklyReport;
