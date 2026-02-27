import { useMemo } from 'react';
import { Subject, Activity, AttendanceRecord } from '@/types/uniflow';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX, TrendingDown, CalendarX, ClipboardX, ChevronRight } from 'lucide-react';

interface RiskIndicatorProps {
  subjects: Subject[];
  activities: Activity[];
  attendance: AttendanceRecord[];
  targetGrade?: number;
  targetAttendance?: number;
}

export interface SubjectRisk {
  subject: Subject;
  level: 'safe' | 'warning' | 'danger';
  score: number; // 0-100 (higher = worse)
  factors: string[];
  gradeAvg: number | null;
  attendanceRate: number | null;
  overdueTasks: number;
}

const RiskIndicator = ({
  subjects,
  activities,
  attendance,
  targetGrade = 7.0,
  targetAttendance = 75,
}: RiskIndicatorProps) => {
  const risks: SubjectRisk[] = useMemo(() => {
    const today = new Date();

    return subjects.map((s) => {
      const factors: string[] = [];
      let riskScore = 0;

      // 1. Grade risk
      const graded = activities.filter((a) => a.subjectId === s.id && a.grade != null);
      const totalWeight = graded.reduce((sum, a) => sum + (a.weight ?? 1), 0);
      const weightedSum = graded.reduce((sum, a) => sum + (a.grade ?? 0) * (a.weight ?? 1), 0);
      const gradeAvg = totalWeight > 0 ? weightedSum / totalWeight : null;

      if (gradeAvg !== null) {
        if (gradeAvg < targetGrade - 2) {
          riskScore += 40;
          factors.push(`Média ${gradeAvg.toFixed(1)} (crítica)`);
        } else if (gradeAvg < targetGrade) {
          riskScore += 20;
          factors.push(`Média ${gradeAvg.toFixed(1)} (abaixo da meta)`);
        }
      }

      // 2. Attendance risk
      const subjectAttendance = attendance.filter((a) => a.subjectId === s.id);
      const totalClasses = subjectAttendance.length;
      const presentClasses = subjectAttendance.filter((a) => a.present).length;
      const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : null;

      if (attendanceRate !== null) {
        if (attendanceRate < targetAttendance - 10) {
          riskScore += 40;
          factors.push(`Frequência ${attendanceRate.toFixed(0)}% (crítica)`);
        } else if (attendanceRate < targetAttendance) {
          riskScore += 20;
          factors.push(`Frequência ${attendanceRate.toFixed(0)}% (baixa)`);
        }
      }

      // 3. Overdue tasks
      const overdueTasks = activities.filter((a) => {
        if (a.subjectId !== s.id) return false;
        if (a.status === 'concluido') return false;
        return new Date(a.deadline) < today;
      }).length;

      if (overdueTasks >= 3) {
        riskScore += 30;
        factors.push(`${overdueTasks} tarefas atrasadas`);
      } else if (overdueTasks >= 1) {
        riskScore += 15;
        factors.push(`${overdueTasks} tarefa${overdueTasks > 1 ? 's' : ''} atrasada${overdueTasks > 1 ? 's' : ''}`);
      }

      // Determine level
      let level: SubjectRisk['level'] = 'safe';
      if (riskScore >= 50) level = 'danger';
      else if (riskScore >= 20) level = 'warning';

      return {
        subject: s,
        level,
        score: Math.min(riskScore, 100),
        factors,
        gradeAvg,
        attendanceRate,
        overdueTasks,
      };
    });
  }, [subjects, activities, attendance, targetGrade, targetAttendance]);

  const dangerCount = risks.filter((r) => r.level === 'danger').length;
  const warningCount = risks.filter((r) => r.level === 'warning').length;
  const safeCount = risks.filter((r) => r.level === 'safe').length;

  // Overall status
  const overallLevel = dangerCount > 0 ? 'danger' : warningCount > 0 ? 'warning' : 'safe';

  const config = {
    safe: {
      icon: ShieldCheck,
      label: 'Tudo sob controle',
      desc: 'Você está no caminho certo!',
      gradient: 'from-success/10 to-success/5',
      border: 'border-success/20',
      iconColor: 'text-success',
      bg: 'bg-success/10',
    },
    warning: {
      icon: ShieldAlert,
      label: 'Atenção necessária',
      desc: `${warningCount} matéria${warningCount > 1 ? 's' : ''} precisa${warningCount > 1 ? 'm' : ''} de cuidado`,
      gradient: 'from-warning/10 to-warning/5',
      border: 'border-warning/20',
      iconColor: 'text-warning',
      bg: 'bg-warning/10',
    },
    danger: {
      icon: ShieldX,
      label: 'Risco de reprovação',
      desc: `${dangerCount} matéria${dangerCount > 1 ? 's' : ''} em situação crítica`,
      gradient: 'from-destructive/10 to-destructive/5',
      border: 'border-destructive/20',
      iconColor: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  };

  const cfg = config[overallLevel];
  const OverallIcon = cfg.icon;

  if (subjects.length === 0) return null;

  // Sort: danger first, then warning, then safe
  const sorted = [...risks].sort((a, b) => {
    const order = { danger: 0, warning: 1, safe: 2 };
    return order[a.level] - order[b.level];
  });

  const factorIcons = {
    média: TrendingDown,
    frequência: CalendarX,
    tarefa: ClipboardX,
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <div className={`rounded-3xl bg-gradient-to-br ${cfg.gradient} border ${cfg.border} p-4 shadow-sm`}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-2xl ${cfg.bg} grid place-items-center`}>
            <OverallIcon className={`w-5 h-5 ${cfg.iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{cfg.label}</p>
            <p className="text-[10px] text-muted-foreground">{cfg.desc}</p>
          </div>
          {/* Summary pills */}
          <div className="flex gap-1.5">
            {dangerCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">
                {dangerCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning">
                {warningCount}
              </span>
            )}
            {safeCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success">
                {safeCount}
              </span>
            )}
          </div>
        </div>

        {/* Per-subject risk rows */}
        <div className="space-y-1.5">
          {sorted.map((risk) => {
            const levelStyles = {
              safe: { dot: 'bg-success', bar: 'bg-success', text: 'text-success' },
              warning: { dot: 'bg-warning', bar: 'bg-warning', text: 'text-warning' },
              danger: { dot: 'bg-destructive', bar: 'bg-destructive', text: 'text-destructive' },
            };
            const ls = levelStyles[risk.level];

            return (
              <div
                key={risk.subject.id}
                className="flex items-center gap-2.5 rounded-2xl bg-card/60 px-3 py-2 border border-border/40"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: risk.subject.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{risk.subject.name}</p>
                  {risk.factors.length > 0 ? (
                    <p className="text-[9px] text-muted-foreground truncate">
                      {risk.factors.join(' · ')}
                    </p>
                  ) : (
                    <p className="text-[9px] text-success">Tudo certo ✓</p>
                  )}
                </div>
                {/* Risk bar */}
                <div className="w-16 shrink-0">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${risk.score}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full rounded-full ${ls.bar}`}
                    />
                  </div>
                </div>
                <span className={`text-[10px] font-bold ${ls.text} w-6 text-right`}>
                  {risk.level === 'safe' ? '✓' : risk.level === 'warning' ? '⚠' : '🚨'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default RiskIndicator;
