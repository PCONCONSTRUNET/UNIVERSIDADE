import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, AttendanceRecord, Subject } from '@/types/uniflow';
import hakiAvatar from '@/assets/haki-avatar.png';

interface Props {
  subjects: Subject[];
  activities: Activity[];
  attendance: AttendanceRecord[];
  academicScore: number;
  onOpenChat?: () => void;
}

type HakiMood = 'happy' | 'thinking' | 'serious' | 'excited';

interface HakiState {
  mood: HakiMood;
  emoji: string;
  greeting: string;
  tip: string;
  borderColor: string;
  glowColor: string;
}

const getHakiState = (
  score: number,
  activities: Activity[],
  attendance: AttendanceRecord[],
  subjects: Subject[],
): HakiState => {
  const now = new Date();
  const overdue = activities.filter(a => a.status !== 'concluido' && new Date(a.deadline) < now);
  const pending = activities.filter(a => a.status !== 'concluido');
  const completed = activities.filter(a => a.status === 'concluido');

  // Check low attendance
  const lowAttendanceSubjects = subjects.filter(s => {
    const records = attendance.filter(r => r.subjectId === s.id);
    if (records.length < 2) return false;
    return (records.filter(r => r.present).length / records.length) * 100 < 75;
  });

  // 🏆 Excited — score >= 85 and no overdue
  if (score >= 85 && overdue.length === 0) {
    return {
      mood: 'excited',
      emoji: '🏆',
      greeting: 'Você tá voando! 🔥',
      tip: completed.length > 0
        ? `Já concluiu ${completed.length} tarefa${completed.length > 1 ? 's' : ''}. Continua assim!`
        : 'Score alto e nada atrasado. Esse é o caminho!',
      borderColor: 'hsl(var(--success))',
      glowColor: 'hsl(var(--success) / 0.15)',
    };
  }

  // 🔴 Serious — overdue tasks or very low score
  if (overdue.length >= 2 || score < 40) {
    return {
      mood: 'serious',
      emoji: '⚠️',
      greeting: 'Precisa de atenção! 👀',
      tip: overdue.length > 0
        ? `${overdue.length} tarefa${overdue.length > 1 ? 's' : ''} atrasada${overdue.length > 1 ? 's' : ''}. Bora resolver?`
        : 'Seu score tá baixo. Posso te ajudar a organizar.',
      borderColor: 'hsl(var(--destructive))',
      glowColor: 'hsl(var(--destructive) / 0.1)',
    };
  }

  // 🟡 Thinking — tasks accumulating or low attendance
  if (pending.length >= 4 || lowAttendanceSubjects.length > 0 || score < 60) {
    const tip = lowAttendanceSubjects.length > 0
      ? `Sua frequência em ${lowAttendanceSubjects[0].name} tá crítica.`
      : pending.length >= 4
        ? `${pending.length} tarefas pendentes. Quer priorizar?`
        : 'Algumas coisas precisam de atenção. Bora organizar?';
    return {
      mood: 'thinking',
      emoji: '🤔',
      greeting: 'Hmm, vamos pensar...',
      tip,
      borderColor: 'hsl(var(--warning))',
      glowColor: 'hsl(var(--warning) / 0.1)',
    };
  }

  // 🟢 Happy — default good state
  return {
    mood: 'happy',
    emoji: '😄',
    greeting: 'Tudo certo por aqui!',
    tip: pending.length > 0
      ? `${pending.length} tarefa${pending.length > 1 ? 's' : ''} pendente${pending.length > 1 ? 's' : ''}. Nada urgente!`
      : 'Nenhuma pendência. Aproveita pra revisar algo!',
    borderColor: 'hsl(var(--primary))',
    glowColor: 'hsl(var(--primary) / 0.1)',
  };
};

const HakiWidget = ({ subjects, activities, attendance, academicScore, onOpenChat }: Props) => {
  const state = useMemo(
    () => getHakiState(academicScore, activities, attendance, subjects),
    [academicScore, activities, attendance, subjects],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.02 }}
    >
      <button
        onClick={onOpenChat}
        className="w-full text-left rounded-3xl bg-card p-4 shadow-sm border-2 border-primary/30 transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.985] group"
      >
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted/30 shadow-sm">
              <img
                src={hakiAvatar}
                alt="Haki"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 text-sm">{state.emoji}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{state.greeting}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
              {state.tip}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <p className="text-[10px] text-primary font-semibold">
                Toque pra conversar com o Haki →
              </p>
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-success"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
      </button>
    </motion.section>
  );
};

export default HakiWidget;
