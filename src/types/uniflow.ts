export type ClassType = 'presencial' | 'hibrida' | 'online';

export interface Schedule {
  day: number; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  startTime: string; // "08:00"
  endTime: string; // "09:40"
}

export interface Subject {
  id: string;
  name: string;
  type: ClassType;
  color: string; // hex
  professor: string;
  location: string; // sala ou link
  schedules: Schedule[];
  workload: number; // carga horária em horas
}

export type Priority = 'baixa' | 'media' | 'alta';
export type ActivityStatus = 'pendente' | 'em_andamento' | 'concluido';

export type ActivityType = 'prova' | 'trabalho' | 'seminario' | 'exercicio';

export interface Subtask {
  text: string;
  checked: boolean;
}

export type AiDifficulty = 'alta' | 'media' | 'baixa';

export interface Activity {
  id: string;
  title: string;
  subjectId: string;
  deadline: string; // ISO date
  priority: Priority;
  status: ActivityStatus;
  activityType: ActivityType;
  description?: string;
  grade?: number | null;
  weight?: number;
  subtasks?: Subtask[];
  updatedAt?: string; // ISO date - used for tracking completion date
  aiDifficulty?: AiDifficulty; // AI-assessed content difficulty
}

export type NoteFontSize = 'small' | 'normal' | 'large';

export const NOTE_COLORS = [
  null, // default
  '#e11d48', '#f472b6', '#fb923c', '#facc15',
  '#84cc16', '#10b981', '#0ea5e9', '#3b82f6',
  '#8b5cf6', '#a78bfa',
];

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  category: string;
  checklist?: { text: string; checked: boolean }[];
  createdAt: string;
  color?: string | null;
  fontSize?: NoteFontSize;
  subjectId?: string | null;
  tags?: string[];
  sortOrder?: number;
}

export interface AttendanceRecord {
  subjectId: string;
  date: string;
  present: boolean;
}

export type TabId = 'dashboard' | 'schedule' | 'activities' | 'grades' | 'notes' | 'attendance' | 'groups' | 'materials' | 'profile';

export const SUBJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6d28d9', '#0ea5e9',
];

export const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DAY_LABELS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
