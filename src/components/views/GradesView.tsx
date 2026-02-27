import { useMemo, useState } from 'react';
import { Activity, Subject } from '@/types/uniflow';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp, Calculator, ChevronDown, ChevronUp, Target, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GradesViewProps {
  activities: Activity[];
  subjects: Subject[];
  targetGrade?: number;
}

interface SubjectGradeData {
  subject: Subject;
  graded: Activity[];
  avg: number | null;
  totalWeight: number;
  weightedSum: number;
  neededGrade: number | null;
  projected: number | null;
  status: 'approved' | 'at-risk' | 'failing' | 'no-grades';
  evolutionData: { name: string; grade: number; cumAvg: number }[];
}

const GradesView = ({ activities, subjects, targetGrade = 7.0 }: GradesViewProps) => {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [simulatedGrades, setSimulatedGrades] = useState<Record<string, number>>({});
  const [simSubject, setSimSubject] = useState<string>('');
  const [simQuickGrade, setSimQuickGrade] = useState<string>('');

  const subjectGrades: SubjectGradeData[] = useMemo(() => {
    return subjects.map(s => {
      const graded = activities
        .filter(a => a.subjectId === s.id && a.grade != null)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

      const totalWeight = graded.reduce((sum, a) => sum + (a.weight ?? 1), 0);
      const weightedSum = graded.reduce((sum, a) => sum + (a.grade ?? 0) * (a.weight ?? 1), 0);
      const avg = totalWeight > 0 ? weightedSum / totalWeight : null;

      // Pending evaluations for this subject
      const pending = activities.filter(a => a.subjectId === s.id && a.grade == null);
      const pendingWeight = pending.reduce((sum, a) => sum + (a.weight ?? 1), 0);

      // What grade needed on remaining evaluations to reach target
      let neededGrade: number | null = null;
      if (pendingWeight > 0) {
        const needed = (targetGrade * (totalWeight + pendingWeight) - weightedSum) / pendingWeight;
        if (needed <= 10 && needed >= 0) neededGrade = needed;
        else if (needed > 10) neededGrade = null; // impossible
        else neededGrade = 0;
      }

      // Projected final grade (if maintaining current avg on remaining)
      let projected: number | null = null;
      if (avg !== null && pendingWeight > 0) {
        projected = (weightedSum + avg * pendingWeight) / (totalWeight + pendingWeight);
      } else if (avg !== null) {
        projected = avg;
      }

      // Include simulation
      const simGrade = simulatedGrades[s.id];
      let simulatedAvg: number | null = null;
      if (simGrade !== undefined && !isNaN(simGrade)) {
        const simWeight = 1;
        simulatedAvg = (weightedSum + simGrade * simWeight) / (totalWeight + simWeight);
      }

      // Status
      let status: SubjectGradeData['status'] = 'no-grades';
      if (avg !== null) {
        if (avg >= targetGrade) status = 'approved';
        else if (neededGrade !== null && neededGrade <= 10) status = 'at-risk';
        else status = 'failing';
      }

      // Evolution data (cumulative weighted average after each grade)
      let cumWeight = 0;
      let cumSum = 0;
      const evolutionData = graded.map((a, i) => {
        cumWeight += (a.weight ?? 1);
        cumSum += (a.grade ?? 0) * (a.weight ?? 1);
        return {
          name: `A${i + 1}`,
          grade: a.grade ?? 0,
          cumAvg: parseFloat((cumSum / cumWeight).toFixed(2)),
        };
      });

      // Add simulated point
      if (simGrade !== undefined && !isNaN(simGrade) && simulatedAvg !== null) {
        evolutionData.push({
          name: 'Sim',
          grade: simGrade,
          cumAvg: parseFloat(simulatedAvg.toFixed(2)),
        });
      }

      return { subject: s, graded, avg, totalWeight, weightedSum, neededGrade, projected, status, evolutionData };
    });
  }, [activities, subjects, targetGrade, simulatedGrades]);

  // Quick simulator result (must be after subjectGrades)
  const simResult = useMemo(() => {
    if (!simSubject || !simQuickGrade || isNaN(parseFloat(simQuickGrade))) return null;
    const data = subjectGrades?.find(s => s.subject.id === simSubject);
    if (!data) return null;
    const grade = parseFloat(simQuickGrade);
    const simWeight = 1;
    return (data.weightedSum + grade * simWeight) / (data.totalWeight + simWeight);
  }, [simSubject, simQuickGrade, subjectGrades]);

  const withGrades = subjectGrades.filter(s => s.graded.length > 0);
  const withoutGrades = subjectGrades.filter(s => s.graded.length === 0);

  const overallAvg = withGrades.length > 0
    ? withGrades.reduce((sum, s) => sum + (s.avg ?? 0), 0) / withGrades.length
    : null;

  const chartData = withGrades.map(s => ({
    name: s.subject.name.length > 10 ? s.subject.name.substring(0, 10) + '…' : s.subject.name,
    avg: s.avg ? parseFloat(s.avg.toFixed(1)) : 0,
    color: s.subject.color,
  }));

  const statusConfig = {
    approved: { icon: CheckCircle2, label: 'Aprovado', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
    'at-risk': { icon: AlertTriangle, label: 'Recuperável', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
    failing: { icon: AlertTriangle, label: 'Crítico', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
    'no-grades': { icon: BookOpen, label: 'Sem notas', color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-muted' },
  };

  const approvedCount = withGrades.filter(s => s.status === 'approved').length;
  const atRiskCount = withGrades.filter(s => s.status === 'at-risk').length;
  const failingCount = withGrades.filter(s => s.status === 'failing').length;

  // Subjects that need attention (have grades but below target)
  const needAttention = subjectGrades.filter(
    s => s.graded.length > 0 && s.neededGrade !== null && s.neededGrade > 0
  );

  return (
    <div className="space-y-6 pb-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Notas & Médias</h1>
        <p className="text-sm text-muted-foreground">Análise estratégica do desempenho</p>
      </motion.div>

      {/* 🎯 GRADE SIMULATOR HERO */}
      {needAttention.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="rounded-2xl bg-gradient-to-br from-primary/5 via-card to-warning/5 border border-primary/15 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 grid place-items-center">
              <Calculator size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">Simulador de Nota</p>
              <p className="text-[10px] text-muted-foreground">Quanto você precisa tirar pra passar</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {needAttention.map((data) => {
              const { subject, avg, neededGrade } = data;
              const urgency =
                neededGrade !== null && neededGrade > 9
                  ? 'critical'
                  : neededGrade !== null && neededGrade > 7
                  ? 'warning'
                  : 'ok';
              const urgencyStyles = {
                critical: 'bg-destructive/10 border-destructive/20 text-destructive',
                warning: 'bg-warning/10 border-warning/20 text-warning',
                ok: 'bg-success/10 border-success/20 text-success',
              };
              return (
                <div
                  key={subject.id}
                  className="flex items-center gap-3 rounded-xl bg-card/60 border border-border/60 px-3 py-2.5"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{subject.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Média atual: <span className="font-bold">{avg?.toFixed(1)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-lg border ${urgencyStyles[urgency]}`}
                    >
                      {neededGrade !== null && neededGrade <= 10 ? (
                        <>
                          <Target size={10} />
                          {neededGrade.toFixed(1)}
                        </>
                      ) : (
                        '✕'
                      )}
                    </span>
                    <p className="text-[9px] text-muted-foreground mt-0.5">na próxima</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick "what if" for the most critical subject */}
          {needAttention.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <Target size={12} className="text-primary" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Simular nota rápido</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={simSubject}
                  onValueChange={setSimSubject}
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {needAttention.map((d) => (
                      <SelectItem key={d.subject.id} value={d.subject.id}>
                        {d.subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  placeholder="Nota"
                  value={simQuickGrade}
                  onChange={(e) => setSimQuickGrade(e.target.value)}
                  className="h-8 w-20 text-xs"
                />
              </div>
              {simResult !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 rounded-lg px-3 py-2"
                  style={{
                    background: simResult >= targetGrade
                      ? 'hsl(var(--success) / 0.1)'
                      : 'hsl(var(--destructive) / 0.1)',
                  }}
                >
                  <p className="text-xs">
                    Se tirar <span className="font-black">{parseFloat(simQuickGrade).toFixed(1)}</span>,
                    sua média fica{' '}
                    <span
                      className={`font-black ${
                        simResult >= targetGrade ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {simResult.toFixed(2)}
                    </span>
                    {' '}
                    {simResult >= targetGrade ? '✅ Aprovado!' : `❌ Falta ${(targetGrade - simResult).toFixed(1)} pts`}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Overall Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl bg-card p-4 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">Média Geral Ponderada</span>
          </div>
          <span className={`text-3xl font-black ${
            overallAvg === null ? 'text-muted-foreground' :
            overallAvg >= targetGrade ? 'text-success' : 
            overallAvg >= targetGrade - 1 ? 'text-warning' : 'text-destructive'
          }`}>
            {overallAvg !== null ? overallAvg.toFixed(1) : '—'}
          </span>
        </div>
        {overallAvg !== null && (
          <Progress
            value={(overallAvg / 10) * 100}
            className={`h-2 ${overallAvg >= targetGrade ? '[&>div]:bg-success' : overallAvg >= targetGrade - 1 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'}`}
          />
        )}

        {/* Status counters */}
        {withGrades.length > 0 && (
          <div className="flex gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-muted-foreground">{approvedCount} aprovado{approvedCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">{atRiskCount} atenção</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">{failingCount} crítico{failingCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Comparison Chart */}
      {chartData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-primary" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">Comparativo por Disciplina</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                <ReferenceLine y={targetGrade} stroke="hsl(var(--warning))" strokeDasharray="4 4" label={{ value: `Meta ${targetGrade}`, fontSize: 8, fill: 'hsl(var(--warning))' }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 12, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [value.toFixed(1), 'Média']}
                />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Per-subject cards */}
      <div className="space-y-3">
        {withGrades.map((data, idx) => {
          const { subject, avg, graded, neededGrade, projected, status, evolutionData, totalWeight, weightedSum } = data;
          const isExpanded = expandedSubject === subject.id;
          const stCfg = statusConfig[status];
          const StIcon = stCfg.icon;
          const simValue = simulatedGrades[subject.id];

          // Simulated avg
          const simWeight = 1;
          const simulatedAvg = simValue !== undefined && !isNaN(simValue)
            ? (weightedSum + simValue * simWeight) / (totalWeight + simWeight)
            : null;

          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.03 }}
              className="rounded-2xl bg-card shadow-sm overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold truncate">{subject.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {graded.length} avaliação{graded.length > 1 ? 'ões' : ''} · Peso total: {totalWeight}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stCfg.bg} ${stCfg.color} ${stCfg.border} border`}>
                    <StIcon size={10} className="inline mr-0.5" />
                    {stCfg.label}
                  </span>
                  <span className={`text-xl font-black ${
                    (avg ?? 0) >= targetGrade ? 'text-success' : (avg ?? 0) >= targetGrade - 1 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {avg?.toFixed(1)}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4">
                      {/* Grades list */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Avaliações</p>
                        {graded.map((a, i) => (
                          <div key={a.id} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground w-5">{i + 1}.</span>
                            <span className="flex-1 truncate">{a.title}</span>
                            <span className="text-[10px] text-muted-foreground">peso {a.weight ?? 1}</span>
                            <span className={`font-bold ${
                              (a.grade ?? 0) >= targetGrade ? 'text-success' : (a.grade ?? 0) >= targetGrade - 1 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {a.grade?.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Evolution chart */}
                      {evolutionData.length >= 2 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Evolução da Média</p>
                          <div className="h-28">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                <YAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                                <ReferenceLine y={targetGrade} stroke="hsl(var(--warning))" strokeDasharray="4 4" />
                                <Tooltip
                                  contentStyle={{ fontSize: 10, borderRadius: 10, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                  formatter={(value: number, name: string) => [
                                    value.toFixed(1),
                                    name === 'cumAvg' ? 'Média Acum.' : 'Nota',
                                  ]}
                                />
                                <Line type="monotone" dataKey="grade" stroke={subject.color} strokeWidth={1.5} dot={{ r: 3 }} opacity={0.5} />
                                <Line type="monotone" dataKey="cumAvg" stroke={subject.color} strokeWidth={2.5} dot={{ r: 4, fill: subject.color }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Projection */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-muted/50 p-3">
                          <p className="text-[9px] text-muted-foreground uppercase font-medium mb-1">Projeção Final</p>
                          <p className={`text-lg font-black ${
                            projected !== null && projected >= targetGrade ? 'text-success' : 'text-warning'
                          }`}>
                            {projected !== null ? projected.toFixed(1) : '—'}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {projected !== null && projected >= targetGrade ? 'Caminho de aprovação ✓' : 'Mantendo média atual'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/50 p-3">
                          <p className="text-[9px] text-muted-foreground uppercase font-medium mb-1">Meta Necessária</p>
                          <p className={`text-lg font-black ${
                            neededGrade === null ? 'text-muted-foreground' :
                            neededGrade <= 7 ? 'text-success' :
                            neededGrade <= 9 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {neededGrade !== null ? neededGrade.toFixed(1) : (avg ?? 0) >= targetGrade ? '✓' : '✕'}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {neededGrade !== null ? 'na próxima avaliação' : (avg ?? 0) >= targetGrade ? 'Meta atingida' : 'Impossível recuperar'}
                          </p>
                        </div>
                      </div>

                      {/* Simulation message */}
                      {neededGrade !== null && (
                        <div className="flex items-center gap-2 rounded-xl bg-warning/10 border border-warning/20 p-3">
                          <Calculator size={16} className="text-warning flex-shrink-0" />
                          <p className="text-xs">
                            Você precisa tirar <span className="font-black text-warning">{neededGrade.toFixed(1)}</span> na próxima prova para atingir média <span className="font-bold">{targetGrade}</span>
                          </p>
                        </div>
                      )}

                      {/* "What if" simulator */}
                      <div className="rounded-xl border border-border p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Target size={14} className="text-primary" />
                          <p className="text-xs font-semibold">Simulador: "E se eu tirar..."</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            placeholder="Nota"
                            value={simValue ?? ''}
                            onChange={e => setSimulatedGrades(prev => ({
                              ...prev,
                              [subject.id]: parseFloat(e.target.value),
                            }))}
                            className="h-9 w-24"
                          />
                          <div className="flex-1">
                            {simulatedAvg !== null ? (
                              <div>
                                <p className="text-xs">
                                  Nova média: <span className={`font-black ${simulatedAvg >= targetGrade ? 'text-success' : 'text-destructive'}`}>
                                    {simulatedAvg.toFixed(2)}
                                  </span>
                                </p>
                                <p className="text-[9px] text-muted-foreground">
                                  {simulatedAvg >= targetGrade ? '✅ Aprovado!' : `❌ Falta ${(targetGrade - simulatedAvg).toFixed(1)} pts`}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">Digite uma nota para simular</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Subjects without grades */}
      {withoutGrades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sem notas registradas</p>
          <div className="space-y-2">
            {withoutGrades.map(({ subject }) => (
              <div key={subject.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm opacity-60">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
                <span className="text-sm flex-1 truncate">{subject.name}</span>
                <span className="text-[10px] text-muted-foreground">Aguardando avaliações</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {subjects.length === 0 && (
        <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
          <BookOpen size={24} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Cadastre disciplinas e adicione notas às atividades</p>
        </div>
      )}
    </div>
  );
};

export default GradesView;
