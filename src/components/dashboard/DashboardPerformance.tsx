import { useMemo } from 'react';
import { Subject, Activity, AttendanceRecord } from '@/types/uniflow';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, CheckCircle2, UserCheck, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface Props {
  subjects: Subject[];
  activities: Activity[];
  attendance: AttendanceRecord[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const DashboardPerformance = ({ subjects, activities, attendance }: Props) => {
  const stats = useMemo(() => {
    const graded = activities.filter(a => (a as any).grade != null);
    const avgGrade = graded.length > 0
      ? graded.reduce((sum, a) => sum + Number((a as any).grade), 0) / graded.length
      : null;

    const totalRecords = attendance.length;
    const presentRecords = attendance.filter(r => r.present).length;
    const avgAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : null;

    const totalTasks = activities.length;
    const completedTasks = activities.filter(a => a.status === 'concluido').length;
    const tasksPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;

    let riskLevel: 'green' | 'yellow' | 'red' = 'green';
    if (avgAttendance !== null && avgAttendance < 75) riskLevel = 'red';
    else if (avgAttendance !== null && avgAttendance < 80) riskLevel = 'yellow';
    if (avgGrade !== null && avgGrade < 5) riskLevel = 'red';
    else if (avgGrade !== null && avgGrade < 6 && riskLevel !== 'red') riskLevel = 'yellow';

    const overdueTasks = activities.filter(a => {
      if (a.status === 'concluido') return false;
      return new Date(a.deadline) < new Date();
    }).length;
    if (overdueTasks > 3) riskLevel = 'red';
    else if (overdueTasks > 0 && riskLevel !== 'red') riskLevel = 'yellow';

    return { avgGrade, avgAttendance, tasksPercent, completedTasks, totalTasks, riskLevel };
  }, [activities, attendance]);

  const riskConfig = {
    green: { icon: ShieldCheck, label: 'Situação Segura', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
    yellow: { icon: Shield, label: 'Atenção Necessária', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    red: { icon: ShieldAlert, label: 'Situação Crítica', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  };

  const risk = riskConfig[stats.riskLevel];
  const RiskIcon = risk.icon;

  const animGrade = useAnimatedCounter(stats.avgGrade ?? 0, 1400, 1);
  const animAttendance = useAnimatedCounter(stats.avgAttendance ?? 0, 1200);
  const animTasks = useAnimatedCounter(stats.tasksPercent ?? 0, 1000);

  return (
    <div>

      {/* Risk Status Banner */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.12, duration: 0.5, type: 'spring', damping: 20 }}
        className={`rounded-3xl border ${risk.border} ${risk.bg} p-3 mb-3 flex items-center gap-3`}
      >
        <motion.div
          initial={{ rotate: -30, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 12 }}
        >
          <RiskIcon size={20} className={risk.color} />
        </motion.div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${risk.color}`}>{risk.label}</p>
          <p className="text-[10px] text-muted-foreground">Baseado em notas, frequência e tarefas</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Average Grade */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
           className="rounded-3xl bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Média Geral</span>
          </div>
          <p className="text-2xl font-black tabular-nums">
            {stats.avgGrade !== null ? animGrade : '—'}
          </p>
          {stats.avgGrade !== null && (
            <Progress
              value={(stats.avgGrade / 10) * 100}
              className="h-1.5 mt-2 [&>div]:bg-primary"
            />
          )}
        </motion.div>

        {/* Attendance */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="rounded-3xl bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={14} className="text-accent" />
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Frequência</span>
          </div>
          <p className="text-2xl font-black tabular-nums">
            {stats.avgAttendance !== null ? `${animAttendance}%` : '—'}
          </p>
          {stats.avgAttendance !== null && (
            <Progress
              value={stats.avgAttendance}
              className={`h-1.5 mt-2 ${stats.avgAttendance < 75 ? '[&>div]:bg-destructive' : '[&>div]:bg-accent'}`}
            />
          )}
        </motion.div>

        {/* Tasks Completed */}
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="rounded-3xl bg-card p-4 shadow-sm col-span-2"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-success" />
              <span className="text-[10px] text-muted-foreground uppercase font-medium">Tarefas Concluídas</span>
            </div>
            <span className="text-sm font-bold tabular-nums">
              {stats.completedTasks}/{stats.totalTasks}
            </span>
          </div>
          <Progress
            value={stats.tasksPercent ?? 0}
            className="h-2 [&>div]:bg-success"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">
            {stats.tasksPercent !== null ? `${animTasks}% completo` : 'Nenhuma tarefa ainda'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPerformance;
