import { useMemo, useState } from 'react';
import { Activity, AttendanceRecord, Note } from '@/types/uniflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Medal, Star, Zap, BookOpen, CheckCircle2, Target, Award, Trophy, TrendingUp, Calendar, ChevronDown, ChevronUp, Lock, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  activities: Activity[];
  attendance: AttendanceRecord[];
  academicScore: number;
  notes?: Note[];
}

interface Achievement {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number; // 0-100
  current: number;
  target: number;
  category: 'streak' | 'tasks' | 'grades' | 'attendance' | 'notes';
  rarity: 'bronze' | 'silver' | 'gold' | 'diamond';
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000];

const LEVEL_TITLES = [
  'Calouro', 'Estudante', 'Aplicado', 'Dedicado', 'Veterano',
  'Destaque', 'Excelência', 'Mestre', 'Lenda', 'Gênio', 'Transcendente',
];

const RARITY_COLORS = {
  bronze: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30', ring: 'ring-orange-500/40' },
  silver: { bg: 'bg-slate-400/10', text: 'text-slate-500', border: 'border-slate-400/30', ring: 'ring-slate-400/40' },
  gold: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/30', ring: 'ring-yellow-500/40' },
  diamond: { bg: 'bg-cyan-400/10', text: 'text-cyan-500', border: 'border-cyan-400/30', ring: 'ring-cyan-400/40' },
};

function computeStreak(activities: Activity[], attendance: AttendanceRecord[], notes: Note[]): number {
  const productiveDates = new Set<string>();

  // Attendance dates
  attendance.forEach(r => {
    if (r.present) productiveDates.add(r.date.split('T')[0]);
  });

  // Completed activities - use updatedAt (actual completion date) instead of deadline
  activities.forEach(a => {
    if (a.status === 'concluido') {
      const completionDate = a.updatedAt || a.deadline;
      productiveDates.add(new Date(completionDate).toISOString().split('T')[0]);
    }
  });

  // Notes created count as productive days
  notes.forEach(n => {
    if (n.createdAt) {
      productiveDates.add(new Date(n.createdAt).toISOString().split('T')[0]);
    }
  });

  if (productiveDates.size === 0) return 0;

  const sorted = Array.from(productiveDates).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i + 1]);
    const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

function computeXP(activities: Activity[], attendance: AttendanceRecord[], academicScore: number, notes: Note[]): number {
  let xp = 0;
  // 10 XP per completed task
  xp += activities.filter(a => a.status === 'concluido').length * 10;
  // 5 XP bonus for graded tasks with grade >= 7
  xp += activities.filter(a => a.status === 'concluido' && a.grade != null && Number(a.grade) >= 7).length * 5;
  // 3 XP per attendance
  xp += attendance.filter(r => r.present).length * 3;
  // 2 XP per note created
  xp += notes.length * 2;
  // Bonus from academic score
  xp += Math.floor(academicScore * 2);
  return xp;
}

function getLevel(xp: number): { level: number; title: string; xpInLevel: number; xpForNext: number; progress: number } {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
    else break;
  }
  if (xp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) level = LEVEL_THRESHOLDS.length - 1;

  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || currentThreshold + 1000;
  const xpInLevel = xp - currentThreshold;
  const xpForNext = nextThreshold - currentThreshold;

  return {
    level,
    title: LEVEL_TITLES[level] || 'Lenda',
    xpInLevel,
    xpForNext,
    progress: Math.min(100, Math.round((xpInLevel / xpForNext) * 100)),
  };
}

const DashboardGamification = ({ activities, attendance, academicScore, notes = [] }: Props) => {
  const [showAchievements, setShowAchievements] = useState(false);

  const streak = useMemo(() => computeStreak(activities, attendance, notes), [activities, attendance, notes]);
  const xp = useMemo(() => computeXP(activities, attendance, academicScore, notes), [activities, attendance, academicScore, notes]);
  const level = useMemo(() => getLevel(xp), [xp]);

  const achievements: Achievement[] = useMemo(() => {
    const completed = activities.filter(a => a.status === 'concluido').length;
    const graded = activities.filter(a => a.grade != null);
    const avgGrade = graded.length > 0 ? graded.reduce((s, a) => s + Number(a.grade), 0) / graded.length : 0;
    const presentCount = attendance.filter(r => r.present).length;
    const noteCount = notes.length;

    return [
      {
        id: 'streak-3', icon: Flame, title: 'Fogo Inicial', description: '3 dias consecutivos produtivos',
        unlocked: streak >= 3, progress: Math.min(100, (streak / 3) * 100), current: Math.min(streak, 3), target: 3,
        category: 'streak', rarity: 'bronze',
      },
      {
        id: 'streak-7', icon: Flame, title: 'Semana de Fogo', description: '7 dias consecutivos produtivos',
        unlocked: streak >= 7, progress: Math.min(100, (streak / 7) * 100), current: Math.min(streak, 7), target: 7,
        category: 'streak', rarity: 'silver',
      },
      {
        id: 'streak-30', icon: Zap, title: 'Imparável', description: '30 dias consecutivos produtivos',
        unlocked: streak >= 30, progress: Math.min(100, (streak / 30) * 100), current: Math.min(streak, 30), target: 30,
        category: 'streak', rarity: 'diamond',
      },
      {
        id: 'tasks-5', icon: CheckCircle2, title: 'Produtivo', description: 'Complete 5 atividades',
        unlocked: completed >= 5, progress: Math.min(100, (completed / 5) * 100), current: Math.min(completed, 5), target: 5,
        category: 'tasks', rarity: 'bronze',
      },
      {
        id: 'tasks-20', icon: CheckCircle2, title: 'Máquina de Tarefas', description: 'Complete 20 atividades',
        unlocked: completed >= 20, progress: Math.min(100, (completed / 20) * 100), current: Math.min(completed, 20), target: 20,
        category: 'tasks', rarity: 'silver',
      },
      {
        id: 'tasks-50', icon: Star, title: 'Lenda das Tarefas', description: 'Complete 50 atividades',
        unlocked: completed >= 50, progress: Math.min(100, (completed / 50) * 100), current: Math.min(completed, 50), target: 50,
        category: 'tasks', rarity: 'gold',
      },
      {
        id: 'notes-10', icon: FileText, title: 'Anotador', description: 'Crie 10 notas',
        unlocked: noteCount >= 10, progress: Math.min(100, (noteCount / 10) * 100), current: Math.min(noteCount, 10), target: 10,
        category: 'notes', rarity: 'bronze',
      },
      {
        id: 'notes-50', icon: FileText, title: 'Escriba', description: 'Crie 50 notas',
        unlocked: noteCount >= 50, progress: Math.min(100, (noteCount / 50) * 100), current: Math.min(noteCount, 50), target: 50,
        category: 'notes', rarity: 'silver',
      },
      {
        id: 'grade-7', icon: BookOpen, title: 'Acima da Média', description: 'Média geral ≥ 7.0',
        unlocked: graded.length > 0 && avgGrade >= 7, progress: graded.length > 0 ? Math.min(100, (avgGrade / 7) * 100) : 0,
        current: graded.length > 0 ? Math.round(avgGrade * 10) / 10 : 0, target: 7,
        category: 'grades', rarity: 'silver',
      },
      {
        id: 'grade-9', icon: Trophy, title: 'Excelência Acadêmica', description: 'Média geral ≥ 9.0',
        unlocked: graded.length > 0 && avgGrade >= 9, progress: graded.length > 0 ? Math.min(100, (avgGrade / 9) * 100) : 0,
        current: graded.length > 0 ? Math.round(avgGrade * 10) / 10 : 0, target: 9,
        category: 'grades', rarity: 'diamond',
      },
      {
        id: 'attend-20', icon: Calendar, title: 'Presente!', description: '20 presenças registradas',
        unlocked: presentCount >= 20, progress: Math.min(100, (presentCount / 20) * 100), current: Math.min(presentCount, 20), target: 20,
        category: 'attendance', rarity: 'bronze',
      },
      {
        id: 'attend-100', icon: Award, title: 'Assíduo', description: '100 presenças registradas',
        unlocked: presentCount >= 100, progress: Math.min(100, (presentCount / 100) * 100), current: Math.min(presentCount, 100), target: 100,
        category: 'attendance', rarity: 'gold',
      },
      {
        id: 'score-80', icon: TrendingUp, title: 'Alto Desempenho', description: 'Score acadêmico ≥ 80',
        unlocked: academicScore >= 80, progress: Math.min(100, (academicScore / 80) * 100), current: Math.min(academicScore, 80), target: 80,
        category: 'grades', rarity: 'gold',
      },
      {
        id: 'score-95', icon: Target, title: 'Perfeição', description: 'Score acadêmico ≥ 95',
        unlocked: academicScore >= 95, progress: Math.min(100, (academicScore / 95) * 100), current: Math.min(academicScore, 95), target: 95,
        category: 'grades', rarity: 'diamond',
      },
    ];
  }, [activities, attendance, streak, academicScore, notes]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div>
      <div className="space-y-3">
        {/* Level + Streak Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Level Card */}
           <div className="rounded-3xl bg-card p-4 shadow-sm border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
                <Star size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Nível {level.level}</p>
                <p className="text-sm font-bold leading-tight">{level.title}</p>
              </div>
            </div>
            <Progress value={level.progress} className="h-1.5 [&>div]:bg-primary" />
            <p className="text-[9px] text-muted-foreground mt-1">
              {level.xpInLevel} / {level.xpForNext} XP
            </p>
          </div>

          {/* Streak Card */}
          <div className="rounded-3xl bg-card p-4 shadow-sm border border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/15"
                animate={streak > 0 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Flame size={16} className="text-warning" />
              </motion.div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Streak</p>
                <p className="text-2xl font-black leading-tight">{streak}</p>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground">
              {streak === 0 ? 'Comece hoje!' : streak === 1 ? '1 dia produtivo' : `${streak} dias seguidos 🔥`}
            </p>
          </div>
        </div>

        {/* XP Bar */}
        <div className="rounded-3xl bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Experiência Total</span>
            <span className="text-sm font-bold text-primary">{xp} XP</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => {
              const segmentFilled = level.progress > i * 10;
              return (
                <motion.div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${segmentFilled ? 'bg-primary' : 'bg-muted'}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                />
              );
            })}
          </div>
        </div>

        {/* Achievements Preview + Toggle */}
        <button
          onClick={() => setShowAchievements(!showAchievements)}
          className="w-full rounded-3xl bg-card p-3 shadow-sm flex items-center justify-between hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Award size={14} className="text-primary" />
            <span className="text-sm font-semibold">Conquistas</span>
            <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
              {unlockedCount}/{achievements.length}
            </span>
          </div>
          {showAchievements ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>

        {/* Achievement mini-row (always visible — show first 6 unlocked or locked) */}
        {!showAchievements && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {achievements.slice(0, 6).map(ach => {
              const rarity = RARITY_COLORS[ach.rarity];
              const Icon = ach.icon;
              return (
                <div
                  key={ach.id}
                  className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl border ${
                    ach.unlocked ? `${rarity.bg} ${rarity.border}` : 'bg-muted/50 border-muted'
                  }`}
                >
                  {ach.unlocked ? (
                    <Icon size={20} className={rarity.text} />
                  ) : (
                    <Lock size={14} className="text-muted-foreground/50" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Full Achievements List */}
        <AnimatePresence>
          {showAchievements && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {achievements.map(ach => {
                const rarity = RARITY_COLORS[ach.rarity];
                const Icon = ach.icon;
                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 rounded-3xl p-3 border ${
                      ach.unlocked ? `bg-card ${rarity.border}` : 'bg-muted/30 border-muted'
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0 ${
                      ach.unlocked ? `${rarity.bg} ring-1 ${rarity.ring}` : 'bg-muted'
                    }`}>
                      {ach.unlocked ? (
                        <Icon size={20} className={rarity.text} />
                      ) : (
                        <Lock size={16} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${!ach.unlocked ? 'text-muted-foreground' : ''}`}>
                          {ach.title}
                        </p>
                        {ach.unlocked && (
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${rarity.bg} ${rarity.text}`}>
                            {ach.rarity}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{ach.description}</p>
                      {!ach.unlocked && (
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={ach.progress} className="h-1 flex-1 [&>div]:bg-muted-foreground/30" />
                          <span className="text-[9px] text-muted-foreground">{ach.current}/{ach.target}</span>
                        </div>
                      )}
                    </div>
                    {ach.unlocked && (
                      <CheckCircle2 size={16} className={rarity.text} />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardGamification;
