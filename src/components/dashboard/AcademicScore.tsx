import { useMemo } from 'react';
import { Subject, Activity, AttendanceRecord } from '@/types/uniflow';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface Props {
  subjects: Subject[];
  activities: Activity[];
  attendance: AttendanceRecord[];
  targetGrade?: number;
  targetAttendance?: number;
  compact?: boolean;
}

export function useAcademicScore(
  activities: Activity[],
  attendance: AttendanceRecord[],
  targetGrade = 7,
  targetAttendance = 75,
) {
  return useMemo(() => {
    // If no data at all, return 0
    const hasAnyData = activities.length > 0 || attendance.length > 0;
    if (!hasAnyData) {
      return {
        total: 0,
        label: 'Sem dados',
        colorClass: 'text-muted-foreground',
        strokeColor: 'hsl(var(--muted-foreground))',
        breakdown: { grade: 0, attendance: 0, tasks: 0, consistency: 0 },
        hasData: false,
      };
    }

    // 1. Grade score (30%) — avg grade relative to target (0-10 scale)
    const graded = activities.filter(a => a.grade != null);
    const avgGrade = graded.length > 0
      ? graded.reduce((sum, a) => sum + Number(a.grade), 0) / graded.length
      : null;
    const gradeScore = avgGrade !== null
      ? Math.min(100, (avgGrade / 10) * 100)
      : 0;

    // 2. Attendance score (25%) — percentage present
    const totalRecords = attendance.length;
    const present = attendance.filter(r => r.present).length;
    const attendancePercent = totalRecords > 0 ? (present / totalRecords) * 100 : 0;
    const attendanceScore = Math.min(100, attendancePercent);

    // 3. Task completion score (25%) — % completed + on-time bonus
    const totalTasks = activities.length;
    const completedTasks = activities.filter(a => a.status === 'concluido').length;
    const overdueTasks = activities.filter(a =>
      a.status !== 'concluido' && new Date(a.deadline) < new Date()
    ).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const overduePenalty = totalTasks > 0 ? (overdueTasks / totalTasks) * 20 : 0;
    const taskScore = Math.max(0, Math.min(100, completionRate - overduePenalty));

    // 4. Consistency score (20%) — only score dimensions that have data
    let consistencyScore = 50;
    if (avgGrade !== null) {
      consistencyScore += avgGrade >= targetGrade ? 25 : -15;
    }
    if (totalRecords > 0) {
      consistencyScore += attendancePercent >= targetAttendance ? 25 : -15;
    }
    consistencyScore = Math.max(0, Math.min(100, consistencyScore));

    // Weight only dimensions that have data
    let weightSum = 0;
    let weighted = 0;
    if (graded.length > 0) { weighted += gradeScore * 0.3; weightSum += 0.3; }
    if (totalRecords > 0) { weighted += attendanceScore * 0.25; weightSum += 0.25; }
    if (totalTasks > 0) { weighted += taskScore * 0.25; weightSum += 0.25; }
    weighted += consistencyScore * 0.2; weightSum += 0.2;

    const total = Math.round(weightSum > 0 ? weighted / weightSum : 0);

    const label =
      total >= 90 ? 'Excelente' :
      total >= 75 ? 'Muito Bom' :
      total >= 60 ? 'Bom' :
      total >= 40 ? 'Regular' : 'Crítico';

    const colorClass =
      total >= 75 ? 'text-success' :
      total >= 50 ? 'text-warning' : 'text-destructive';

    const strokeColor =
      total >= 75 ? 'hsl(var(--success))' :
      total >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

    return {
      total,
      label,
      colorClass,
      strokeColor,
      breakdown: {
        grade: Math.round(gradeScore),
        attendance: Math.round(attendanceScore),
        tasks: Math.round(taskScore),
        consistency: Math.round(consistencyScore),
      },
      hasData: true,
    };
  }, [activities, attendance, targetGrade, targetAttendance]);
}

const AcademicScore = ({ subjects, activities, attendance, targetGrade, targetAttendance, compact = false }: Props) => {
  const score = useAcademicScore(activities, attendance, targetGrade, targetAttendance);

  const size = compact ? 80 : 120;
  const strokeWidth = compact ? 6 : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score.total / 100) * circumference;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
            <motion.circle
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke={score.strokeColor} strokeWidth={strokeWidth}
              strokeLinecap="round" strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - progress }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-black ${score.colorClass}`}>{score.total}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold">Score Acadêmico</p>
          <p className={`text-xs font-medium ${score.colorClass}`}>{score.label}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <h2 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Trophy size={12} /> Score Acadêmico
      </h2>
      <div className="rounded-3xl bg-card p-4 shadow-sm border border-border/30">
        <div className="flex items-center gap-5">
          {/* Circular gauge */}
          <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
              <motion.circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={score.strokeColor} strokeWidth={strokeWidth}
                strokeLinecap="round" strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - progress }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className={`text-3xl font-black ${score.colorClass}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {score.total}
              </motion.span>
              <span className="text-[9px] text-muted-foreground font-medium">/ 100</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-2">
            <p className={`text-sm font-bold ${score.colorClass}`}>{score.label}</p>
            {[
              { label: 'Notas', value: score.breakdown.grade, weight: '30%' },
              { label: 'Frequência', value: score.breakdown.attendance, weight: '25%' },
              { label: 'Tarefas', value: score.breakdown.tasks, weight: '25%' },
              { label: 'Consistência', value: score.breakdown.consistency, weight: '20%' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20">{item.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: score.strokeColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground w-6 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default AcademicScore;
