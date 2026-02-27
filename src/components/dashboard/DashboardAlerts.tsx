import { useMemo } from 'react';
import { Subject, Activity, AttendanceRecord } from '@/types/uniflow';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, UserCheck, BookOpen, CalendarX } from 'lucide-react';

interface Props {
  subjects: Subject[];
  activities: Activity[];
  attendance: AttendanceRecord[];
}

interface Alert {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

const DashboardAlerts = ({ subjects, activities, attendance }: Props) => {
  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];
    const now = new Date();

    // 1. Overdue tasks
    const overdue = activities.filter(a => a.status !== 'concluido' && new Date(a.deadline) < now);
    if (overdue.length > 0) {
      result.push({
        id: 'overdue',
        icon: Clock,
        title: `${overdue.length} tarefa${overdue.length > 1 ? 's' : ''} atrasada${overdue.length > 1 ? 's' : ''}`,
        description: overdue.slice(0, 2).map(a => a.title).join(', ') + (overdue.length > 2 ? ` +${overdue.length - 2}` : ''),
        severity: 'high',
      });
    }

    // 2. Low attendance per subject
    subjects.forEach(s => {
      const records = attendance.filter(r => r.subjectId === s.id);
      if (records.length < 2) return;
      const pct = Math.round((records.filter(r => r.present).length / records.length) * 100);
      if (pct < 75) {
        result.push({
          id: `att-${s.id}`,
          icon: UserCheck,
          title: `Frequência crítica: ${s.name}`,
          description: `Apenas ${pct}% — risco de reprovação por falta`,
          severity: 'high',
        });
      }
    });

    // 3. Low grades
    const gradedBySubject = new Map<string, number[]>();
    activities.forEach(a => {
      const grade = (a as any).grade;
      if (grade != null) {
        const existing = gradedBySubject.get(a.subjectId) || [];
        existing.push(Number(grade));
        gradedBySubject.set(a.subjectId, existing);
      }
    });
    gradedBySubject.forEach((grades, subjectId) => {
      const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
      if (avg < 6) {
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
          result.push({
            id: `grade-${subjectId}`,
            icon: BookOpen,
            title: `Nota baixa: ${subject.name}`,
            description: `Média ${avg.toFixed(1)} — abaixo do mínimo recomendado`,
            severity: avg < 4 ? 'high' : 'medium',
          });
        }
      }
    });

    // 4. Schedule conflicts
    const allSchedules = subjects.flatMap(s =>
      s.schedules.map(sch => ({ subject: s, schedule: sch }))
    );
    for (let i = 0; i < allSchedules.length; i++) {
      for (let j = i + 1; j < allSchedules.length; j++) {
        const a = allSchedules[i];
        const b = allSchedules[j];
        if (a.schedule.day === b.schedule.day) {
          if (a.schedule.startTime < b.schedule.endTime && b.schedule.startTime < a.schedule.endTime) {
            result.push({
              id: `conflict-${a.subject.id}-${b.subject.id}-${a.schedule.day}`,
              icon: CalendarX,
              title: 'Conflito de horário',
              description: `${a.subject.name} e ${b.subject.name} se sobrepõem`,
              severity: 'medium',
            });
          }
        }
      }
    }

    // Sort by severity
    const order = { high: 0, medium: 1, low: 2 };
    return result.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [subjects, activities, attendance]);

  if (alerts.length === 0) return null;

  const severityStyles = {
    high: 'border-destructive/30 bg-destructive/5',
    medium: 'border-warning/30 bg-warning/5',
    low: 'border-muted bg-muted/30',
  };

  const iconStyles = {
    high: 'text-destructive bg-destructive/15',
    medium: 'text-warning bg-warning/15',
    low: 'text-muted-foreground bg-muted',
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <h2 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <AlertTriangle size={12} className="text-warning" /> Alertas Inteligentes
      </h2>

      <div className="space-y-2">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 rounded-3xl border p-3 ${severityStyles[alert.severity]}`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-2xl flex-shrink-0 ${iconStyles[alert.severity]}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{alert.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{alert.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

export default DashboardAlerts;
