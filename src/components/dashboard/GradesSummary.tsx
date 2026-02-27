import { useMemo } from 'react';
import { Activity, Subject } from '@/types/uniflow';
import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, Calculator } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface Props {
  activities: Activity[];
  subjects: Subject[];
  targetGrade?: number;
}

const GradesSummary = ({ activities, subjects, targetGrade = 7.0 }: Props) => {
  const subjectGrades = useMemo(() => {
    return subjects.map(s => {
      const graded = activities.filter(a => a.subjectId === s.id && a.grade != null);
      const totalWeight = graded.reduce((sum, a) => sum + (a.weight ?? 1), 0);
      const weightedSum = graded.reduce((sum, a) => sum + (a.grade ?? 0) * (a.weight ?? 1), 0);
      const avg = totalWeight > 0 ? weightedSum / totalWeight : null;

      // Simulation: what grade needed on next evaluation to reach target
      const nextWeight = 1;
      let neededGrade: number | null = null;
      if (avg !== null && avg < targetGrade && graded.length > 0) {
        // (weightedSum + needed * nextWeight) / (totalWeight + nextWeight) >= targetGrade
        neededGrade = (targetGrade * (totalWeight + nextWeight) - weightedSum) / nextWeight;
        if (neededGrade > 10) neededGrade = null; // impossible
        if (neededGrade !== null && neededGrade < 0) neededGrade = 0;
      }

      // Projected final grade (simple: current avg)
      const projected = avg;

      return {
        subject: s,
        graded,
        avg,
        totalWeight,
        neededGrade,
        projected,
      };
    }).filter(s => s.graded.length > 0);
  }, [activities, subjects]);

  const chartData = useMemo(() => {
    return subjectGrades.map(s => ({
      name: s.subject.name.length > 12 ? s.subject.name.substring(0, 12) + '…' : s.subject.name,
      grade: s.avg ? parseFloat(s.avg.toFixed(1)) : 0,
      color: s.subject.color,
    }));
  }, [subjectGrades]);

  if (subjectGrades.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-4 shadow-sm text-center">
        <BookOpen size={20} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Adicione notas às atividades para ver a análise</p>
      </div>
    );
  }

  const overallAvg = subjectGrades.reduce((sum, s) => sum + (s.avg ?? 0), 0) / subjectGrades.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Overall average */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">Média Geral Ponderada</span>
          </div>
          <span className={`text-2xl font-black ${overallAvg >= 6 ? 'text-success' : 'text-destructive'}`}>
            {overallAvg.toFixed(1)}
          </span>
        </div>
        <Progress
          value={(overallAvg / 10) * 100}
          className={`h-2 ${overallAvg >= 6 ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`}
        />
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Evolução por Disciplina</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 12 }}
                  formatter={(value: number) => [value.toFixed(1), 'Média']}
                />
                <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-subject details with simulation */}
      {subjectGrades.map(({ subject, avg, graded, neededGrade, projected }) => (
        <div key={subject.id} className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
            <span className="text-xs font-semibold flex-1 truncate">{subject.name}</span>
            <span className={`text-sm font-black ${(avg ?? 0) >= 6 ? 'text-success' : 'text-destructive'}`}>
              {avg?.toFixed(1)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">
            {graded.length} avaliação{graded.length > 1 ? 'ões' : ''} registrada{graded.length > 1 ? 's' : ''}
          </p>

          {/* Simulation */}
          {neededGrade !== null && (
            <div className="flex items-center gap-2 rounded-xl bg-warning/10 border border-warning/20 p-2.5">
              <Calculator size={14} className="text-warning flex-shrink-0" />
              <p className="text-[11px]">
                Você precisa tirar <span className="font-black text-warning">{neededGrade.toFixed(1)}</span> na próxima avaliação para atingir média 7.0
              </p>
            </div>
          )}

          {avg !== null && avg >= 7 && (
            <div className="flex items-center gap-2 rounded-xl bg-success/10 border border-success/20 p-2.5">
              <TrendingUp size={14} className="text-success flex-shrink-0" />
              <p className="text-[11px] text-success font-medium">
                Projeção: aprovado com média {projected?.toFixed(1)} ✓
              </p>
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
};

export default GradesSummary;
