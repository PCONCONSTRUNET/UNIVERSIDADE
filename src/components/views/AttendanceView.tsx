import { useState, useMemo } from 'react';
import { Subject, AttendanceRecord, DAY_LABELS_FULL } from '@/types/uniflow';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, Calendar, UserCheck, Settings2, Calculator, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid } from 'recharts';

interface AttendanceViewProps {
  subjects: Subject[];
  attendance: AttendanceRecord[];
  onMarkAttendance: (subjectId: string, date: string, present: boolean) => void;
}

const AttendanceView = ({ subjects, attendance, onMarkAttendance }: AttendanceViewProps) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [minThreshold, setMinThreshold] = useState(() => {
    const saved = localStorage.getItem('uniflow_min_threshold');
    return saved ? Number(saved) : 75;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [simulateAbsences, setSimulateAbsences] = useState<Record<string, number>>({});
  const today = new Date();

  const subjectStats = useMemo(() => {
    return subjects.map(subject => {
      const records = attendance.filter(r => r.subjectId === subject.id);
      const total = records.length;
      const present = records.filter(r => r.present).length;
      const absent = total - present;
      const percentage = total === 0 ? 100 : Math.round((present / total) * 100);
      const isAtRisk = percentage < minThreshold && total > 0;

      // Calculate remaining absences allowed
      // If student has attended `present` out of `total`, how many more can they miss?
      // Need: present / (total + x) >= threshold/100  → x = present*100/threshold - total
      const maxTotalClasses = total === 0 ? 0 : Math.floor((present * 100) / minThreshold);
      const remainingAbsences = Math.max(0, maxTotalClasses - total);

      // Simulation: if student misses N more classes
      const simExtra = simulateAbsences[subject.id] || 0;
      const simTotal = total + simExtra;
      const simPercentage = simTotal === 0 ? 100 : Math.round((present / simTotal) * 100);
      const simAtRisk = simPercentage < minThreshold && simTotal > 0;

      // How many presences needed to recover
      const classesNeeded = isAtRisk
        ? Math.max(0, Math.ceil((minThreshold * total - present * 100) / (100 - minThreshold)))
        : 0;

      return {
        subject, records, total, present, absent, percentage, isAtRisk,
        remainingAbsences, classesNeeded,
        simExtra, simTotal, simPercentage, simAtRisk,
      };
    });
  }, [subjects, attendance, minThreshold, simulateAbsences]);

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; present: number; absent: number }> = {};
    attendance.forEach(r => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short' });
      if (!months[key]) months[key] = { month: label, present: 0, absent: 0 };
      if (r.present) months[key].present++;
      else months[key].absent++;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [attendance]);

  const atRiskSubjects = subjectStats.filter(s => s.isAtRisk);
  const overallPresent = attendance.filter(r => r.present).length;
  const overallTotal = attendance.length;
  const overallPercentage = overallTotal === 0 ? 100 : Math.round((overallPresent / overallTotal) * 100);

  const todayClasses = useMemo(() => {
    const dayOfWeek = today.getDay();
    return subjects.filter(s => s.schedules.some(sch => sch.day === dayOfWeek));
  }, [subjects]);

  const isTodayMarked = (subjectId: string) => {
    const dateStr = today.toISOString().split('T')[0];
    return attendance.some(r => r.subjectId === subjectId && r.date === dateStr);
  };

  const getTodayRecord = (subjectId: string) => {
    const dateStr = today.toISOString().split('T')[0];
    return attendance.find(r => r.subjectId === subjectId && r.date === dateStr);
  };

  const handleMark = (subjectId: string, present: boolean) => {
    const dateStr = today.toISOString().split('T')[0];
    onMarkAttendance(subjectId, dateStr, present);
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Frequência</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'rounded-full p-2 transition-colors',
            showSettings ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
          )}
        >
          <Settings2 size={16} />
        </button>
      </div>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-card p-4 shadow-sm space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Meta mínima de frequência (%)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="50"
                    max="100"
                    value={minThreshold}
                    onChange={e => {
                      const val = Number(e.target.value) || 75;
                      setMinThreshold(val);
                      localStorage.setItem('uniflow_min_threshold', String(val));
                    }}
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">Padrão: 75%</span>
                </div>
                <Progress value={minThreshold} className="h-1.5 [&>div]:bg-primary" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall Stats */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
          <UserCheck size={18} className="mx-auto mb-1 text-primary" />
          <p className={cn('text-xl font-bold', overallPercentage < minThreshold ? 'text-destructive' : '')}>{overallPercentage}%</p>
          <p className="text-[10px] text-muted-foreground">Geral</p>
        </div>
        <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
          <CheckCircle2 size={18} className="mx-auto mb-1 text-success" />
          <p className="text-xl font-bold">{overallPresent}</p>
          <p className="text-[10px] text-muted-foreground">Presenças</p>
        </div>
        <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
          <XCircle size={18} className="mx-auto mb-1 text-destructive" />
          <p className="text-xl font-bold">{overallTotal - overallPresent}</p>
          <p className="text-[10px] text-muted-foreground">Faltas</p>
        </div>
      </motion.div>

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <BarChart3 size={12} /> Gráfico Mensal
          </h2>
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Bar dataKey="present" name="Presenças" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="absent" name="Faltas" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-success" />
                <span className="text-[10px] text-muted-foreground">Presenças</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-destructive" />
                <span className="text-[10px] text-muted-foreground">Faltas</span>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* At Risk Alert */}
      {atRiskSubjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-destructive" />
            <p className="text-xs font-bold text-destructive uppercase tracking-wider">Risco de Reprovação por Falta</p>
          </div>
          <div className="space-y-2">
            {atRiskSubjects.map(stat => (
              <div key={stat.subject.id} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stat.subject.color }} />
                <span className="text-xs font-medium flex-1">{stat.subject.name}</span>
                <span className="text-xs font-bold text-destructive">{stat.percentage}%</span>
                <span className="text-[10px] text-muted-foreground">
                  (+{stat.classesNeeded} aulas)
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Today's Attendance */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Calendar size={12} />
          Marcar Presença — {DAY_LABELS_FULL[today.getDay()]}, {today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </h2>
        {todayClasses.length === 0 ? (
          <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Sem aulas hoje 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayClasses.map(subject => {
              const marked = isTodayMarked(subject.id);
              const record = getTodayRecord(subject.id);
              const schedule = subject.schedules.find(s => s.day === today.getDay());
              return (
                <div
                  key={subject.id}
                  className="rounded-2xl bg-card p-3 shadow-sm"
                  style={{ borderLeft: `4px solid ${subject.color}` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{subject.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {schedule?.startTime} - {schedule?.endTime} · {subject.location}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleMark(subject.id, true)}
                        className={cn(
                          'flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors',
                          marked && record?.present
                            ? 'bg-success/25 text-success ring-2 ring-success/40'
                            : 'bg-success/10 text-success hover:bg-success/20'
                        )}
                      >
                        <CheckCircle2 size={12} /> Presente
                      </button>
                      <button
                        onClick={() => handleMark(subject.id, false)}
                        className={cn(
                          'flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors',
                          marked && record && !record.present
                            ? 'bg-destructive/25 text-destructive ring-2 ring-destructive/40'
                            : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                        )}
                      >
                        <XCircle size={12} /> Falta
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* Per-Subject Stats with Simulation */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <TrendingUp size={12} />
          Frequência por Disciplina
        </h2>
        <div className="space-y-2">
          {subjectStats.map(stat => (
            <div key={stat.subject.id}>
              <button
                onClick={() => setSelectedSubjectId(selectedSubjectId === stat.subject.id ? null : stat.subject.id)}
                className="w-full rounded-2xl bg-card p-3 shadow-sm text-left transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: stat.subject.color }} />
                  <span className="text-sm font-medium flex-1 truncate">{stat.subject.name}</span>
                  <span className={cn(
                    'text-sm font-bold',
                    stat.isAtRisk ? 'text-destructive' : 'text-success'
                  )}>
                    {stat.percentage}%
                  </span>
                </div>
                <Progress
                  value={stat.percentage}
                  className={cn('h-2', stat.isAtRisk ? '[&>div]:bg-destructive' : '[&>div]:bg-success')}
                />
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                  <span>{stat.present} presenças</span>
                  <span>{stat.absent} faltas</span>
                  <span>{stat.total} aulas</span>
                  {!stat.isAtRisk && stat.total > 0 && (
                    <span className="text-success font-medium">
                      Pode faltar mais {stat.remainingAbsences}×
                    </span>
                  )}
                  {stat.isAtRisk && stat.total > 0 && (
                    <span className="text-destructive font-bold flex items-center gap-0.5">
                      <AlertTriangle size={10} /> Risco
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded: simulation + history */}
              <AnimatePresence>
                {selectedSubjectId === stat.subject.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-2 mt-2 mb-2 space-y-3">
                      {/* Simulation */}
                      {stat.total > 0 && (
                        <div className="rounded-xl bg-warning/5 border border-warning/20 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Calculator size={14} className="text-warning" />
                            <span className="text-[11px] font-bold text-warning uppercase">Simulação</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Se faltar mais quantas aulas?
                          </p>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              value={simulateAbsences[stat.subject.id] || 0}
                              onChange={e => setSimulateAbsences(prev => ({
                                ...prev,
                                [stat.subject.id]: Number(e.target.value) || 0,
                              }))}
                              className="w-16 h-7 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">faltas extras</span>
                          </div>
                          {stat.simExtra > 0 && (
                            <div className={cn(
                              'rounded-lg p-2 text-[11px] font-medium',
                              stat.simAtRisk
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-success/10 text-success'
                            )}>
                              {stat.simAtRisk
                                ? `⚠️ Com +${stat.simExtra} faltas sua frequência cairia para ${stat.simPercentage}% — REPROVADO por falta!`
                                : `✅ Com +${stat.simExtra} faltas sua frequência seria ${stat.simPercentage}% — Ainda seguro.`
                              }
                            </div>
                          )}
                          {!stat.isAtRisk && stat.remainingAbsences > 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              Você ainda pode faltar <span className="font-black text-foreground">{stat.remainingAbsences}</span> aula{stat.remainingAbsences > 1 ? 's' : ''} sem risco.
                            </p>
                          )}
                          {stat.isAtRisk && (
                            <p className="text-[11px] text-destructive font-medium">
                              Precisa de +{stat.classesNeeded} presença{stat.classesNeeded > 1 ? 's' : ''} consecutiva{stat.classesNeeded > 1 ? 's' : ''} para recuperar.
                            </p>
                          )}
                        </div>
                      )}

                      {/* History */}
                      {stat.records.length > 0 && (
                        <div className="border-l-2 border-border pl-3 space-y-1">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Histórico</p>
                          {stat.records
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .slice(0, 10)
                            .map((record, idx) => (
                              <button
                                key={idx}
                                onClick={() => onMarkAttendance(stat.subject.id, record.date, !record.present)}
                                className="flex items-center gap-2 text-[10px] w-full text-left hover:bg-secondary/50 rounded-lg px-1.5 py-0.5 -mx-1.5 transition-colors group/hist"
                              >
                                {record.present ? (
                                  <CheckCircle2 size={10} className="text-success" />
                                ) : (
                                  <XCircle size={10} className="text-destructive" />
                                )}
                                <span className="text-muted-foreground">
                                  {new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' })}
                                </span>
                                <span className={record.present ? 'text-success' : 'text-destructive'}>
                                  {record.present ? 'Presente' : 'Falta'}
                                </span>
                                <span className="ml-auto text-muted-foreground/0 group-hover/hist:text-muted-foreground transition-colors text-[9px]">
                                  editar
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default AttendanceView;
