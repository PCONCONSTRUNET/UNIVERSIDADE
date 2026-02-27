import { useMemo } from 'react';
import { Subject, Activity } from '@/types/uniflow';
import { motion } from 'framer-motion';
import { Target, Clock, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  subjects: Subject[];
  activities: Activity[];
  weeklyHoursGoal: number;
}

const DashboardGoals = ({ subjects, activities, weeklyHoursGoal }: Props) => {
  const stats = useMemo(() => {
    // Calculate total weekly workload from subjects
    const totalWeeklyHours = subjects.reduce((sum, s) => {
      const hoursPerWeek = s.schedules.reduce((h, sch) => {
        const [sh, sm] = sch.startTime.split(':').map(Number);
        const [eh, em] = sch.endTime.split(':').map(Number);
        return h + (eh - sh) + (em - sm) / 60;
      }, 0);
      return sum + hoursPerWeek;
    }, 0);

    // Week countdown
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 6;
    const hoursLeft = daysUntilFriday * 24 + (23 - now.getHours());

    // Subject goals (tasks per subject)
    const subjectStats = subjects.map(s => {
      const subjectActivities = activities.filter(a => a.subjectId === s.id);
      const completed = subjectActivities.filter(a => a.status === 'concluido').length;
      const total = subjectActivities.length;
      return { subject: s, completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }).filter(s => s.total > 0).sort((a, b) => a.percent - b.percent);

    return { totalWeeklyHours, weeklyGoalPercent: Math.min(100, Math.round((totalWeeklyHours / weeklyHoursGoal) * 100)), daysUntilFriday, hoursLeft, subjectStats };
  }, [subjects, activities, weeklyHoursGoal]);

  return (
    <div>

      <div className="space-y-3">
        {/* Weekly Hours Goal */}
         <div className="rounded-3xl bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-primary" />
              <span className="text-xs font-medium">Horas Semanais</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {stats.totalWeeklyHours.toFixed(0)}h / {weeklyHoursGoal}h
            </span>
          </div>
          <Progress value={stats.weeklyGoalPercent} className="h-2 [&>div]:bg-primary" />

          {/* Week Countdown */}
          <div className="flex items-center gap-1.5 mt-2">
            <Timer size={11} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {stats.daysUntilFriday === 0
                ? 'Último dia da semana!'
                : `${stats.daysUntilFriday} dia${stats.daysUntilFriday > 1 ? 's' : ''} restante${stats.daysUntilFriday > 1 ? 's' : ''} na semana`
              }
            </span>
          </div>
        </div>

        {/* Subject Progress */}
        {stats.subjectStats.length > 0 && (
          <div className="rounded-3xl bg-card p-4 shadow-sm">
            <p className="text-xs font-medium mb-3">Progresso por Disciplina</p>
            <div className="space-y-3">
              {stats.subjectStats.slice(0, 5).map(({ subject, completed, total, percent }) => (
                <div key={subject.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                      <span className="text-xs truncate">{subject.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                      {completed}/{total}
                    </span>
                  </div>
                  <Progress value={percent} className="h-1.5" style={{ '--progress-color': subject.color } as any} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardGoals;
