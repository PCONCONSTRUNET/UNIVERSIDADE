import { Activity, Subject, AttendanceRecord, AiDifficulty } from '@/types/uniflow';
import { AcademicStatus } from '@/hooks/useProfile';

export interface SmartPriority {
  score: number; // 0-100, higher = more urgent
  label: string;
  reason: string;
  level: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Maps AI difficulty to a numeric score (0-100)
 */
function difficultyToScore(difficulty?: AiDifficulty): number {
  switch (difficulty) {
    case 'alta': return 85;
    case 'media': return 45;
    case 'baixa': return 15;
    default: return 40; // no AI data → neutral
  }
}

/**
 * Calculates automatic priority score based on:
 * - Deadline proximity (30% weight)
 * - Weight in grade average (20% weight)
 * - Risk level of subject (25% weight)
 * - AI content difficulty (25% weight)
 */
export function calculateSmartPriority(
  activity: Activity,
  subjects: Subject[],
  activities: Activity[],
  attendance: AttendanceRecord[],
  academicStatus: AcademicStatus = 'calouro',
): SmartPriority {
  if (activity.status === 'concluido') {
    return { score: 0, label: 'Concluída', reason: 'Já entregue', level: 'low' };
  }

  const now = new Date();
  const deadline = new Date(activity.deadline);
  const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  // ─── 1. Deadline Score (0-100) ───
  let deadlineScore: number;
  if (hoursLeft < 0) {
    deadlineScore = 100; // overdue
  } else if (hoursLeft <= 12) {
    deadlineScore = 95;
  } else if (hoursLeft <= 24) {
    deadlineScore = 85;
  } else if (hoursLeft <= 48) {
    deadlineScore = 70;
  } else if (hoursLeft <= 72) {
    deadlineScore = 55;
  } else if (hoursLeft <= 168) { // 7 days
    deadlineScore = 35;
  } else if (hoursLeft <= 336) { // 14 days
    deadlineScore = 20;
  } else {
    deadlineScore = 5;
  }

  // ─── 2. Weight Score (0-100) ───
  const weight = activity.weight ?? 1;
  const isExam = activity.activityType === 'prova';
  const isSeminar = activity.activityType === 'seminario';
  const typeMultiplier = isExam ? 1.5 : isSeminar ? 1.2 : 1;
  const weightScore = Math.min(100, (weight * typeMultiplier) * 25);

  // ─── 3. Risk Score (0-100) ───
  const subject = subjects.find(s => s.id === activity.subjectId);
  let riskScore = 30;

  if (subject) {
    const subjectActivities = activities.filter(a => a.subjectId === subject.id && a.grade != null);
    if (subjectActivities.length > 0) {
      const avg = subjectActivities.reduce((s, a) => s + (a.grade || 0), 0) / subjectActivities.length;
      if (avg < 5) riskScore = 90;
      else if (avg < 6) riskScore = 70;
      else if (avg < 7) riskScore = 50;
      else riskScore = 20;
    }

    const subjectAttendance = attendance.filter(r => r.subjectId === subject.id);
    if (subjectAttendance.length > 0) {
      const rate = subjectAttendance.filter(r => r.present).length / subjectAttendance.length;
      if (rate < 0.75) riskScore = Math.max(riskScore, 80);
      else if (rate < 0.85) riskScore = Math.max(riskScore, 50);
    }

    const overdueCount = activities.filter(a =>
      a.subjectId === subject.id && a.status !== 'concluido' && new Date(a.deadline) < now
    ).length;
    if (overdueCount >= 2) riskScore = Math.max(riskScore, 75);
  }

  // ─── 4. AI Difficulty Score (0-100) ───
  const aiScore = difficultyToScore(activity.aiDifficulty);

  // ─── 5. Academic Status Modifier ───
  // Calouros get a boost: exams and seminars feel harder, deadlines are less familiar
  const statusBoost = academicStatus === 'calouro'
    ? (isExam ? 12 : isSeminar ? 8 : 5)
    : 0;

  // ─── Composite Score ───
  const totalScore = Math.min(100, Math.round(
    deadlineScore * 0.30 +
    weightScore * 0.20 +
    riskScore * 0.25 +
    aiScore * 0.25 +
    statusBoost
  ));

  // ─── Determine level and reason ───
  let level: SmartPriority['level'];
  let label: string;
  if (totalScore >= 75) { level = 'critical'; label = 'Urgente'; }
  else if (totalScore >= 50) { level = 'high'; label = 'Alta'; }
  else if (totalScore >= 25) { level = 'medium'; label = 'Média'; }
  else { level = 'low'; label = 'Baixa'; }

  // Build reason
  const reasons: string[] = [];
  if (hoursLeft < 0) reasons.push('Atrasada');
  else if (hoursLeft <= 24) reasons.push('Prazo muito próximo');
  else if (hoursLeft <= 48) reasons.push('Prazo em breve');
  if (weight >= 3) reasons.push('Alto peso na média');
  if (isExam) reasons.push('Prova');
  if (riskScore >= 70) reasons.push('Disciplina em risco');
  if (activity.aiDifficulty === 'alta') reasons.push('Conteúdo difícil');
  else if (activity.aiDifficulty === 'baixa') reasons.push('Conteúdo simples');
  if (academicStatus === 'calouro' && (isExam || isSeminar)) reasons.push('Calouro');

  return {
    score: totalScore,
    label,
    reason: reasons.join(' · ') || 'Prioridade normal',
    level,
  };
}

export function sortBySmartPriority(
  activities: Activity[],
  subjects: Subject[],
  allActivities: Activity[],
  attendance: AttendanceRecord[],
  academicStatus: AcademicStatus = 'calouro',
): (Activity & { smartPriority: SmartPriority })[] {
  return activities
    .map(a => ({
      ...a,
      smartPriority: calculateSmartPriority(a, subjects, allActivities, attendance, academicStatus),
    }))
    .sort((a, b) => b.smartPriority.score - a.smartPriority.score);
}
