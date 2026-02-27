import { Subject, Activity, AttendanceRecord } from '@/types/uniflow';
import { useWebNotifications } from '@/hooks/useWebNotifications';
import { useSubscription } from '@/hooks/useSubscription';
import { useReferrals } from '@/hooks/useReferrals';
import { User, Moon, Sun, Bell, BookOpen, CheckCircle2, Clock, ChevronRight, LogOut, BellRing, CalendarCheck, FileText, GraduationCap, Target, Download, Crown, Sparkles, Save, Trophy, FileDown, Plus, Trash2, Smartphone, X, Gift, Share2, Copy, Users, Check } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import AcademicScore from '@/components/dashboard/AcademicScore';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, AcademicStatus } from '@/hooks/useProfile';
import { useGoals, Goal } from '@/hooks/useGoals';
import { useCourses, Course } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import avatarMale1 from '@/assets/avatar-male-1.png';
import avatarMale2 from '@/assets/avatar-male-2.png';
import avatarMale3 from '@/assets/avatar-male-3.png';
import avatarFemale1 from '@/assets/avatar-female-1.png';
import avatarFemale2 from '@/assets/avatar-female-2.png';
import avatarFemale3 from '@/assets/avatar-female-3.png';

const AVATARS = [
  { id: 'panda-m', src: avatarMale1, label: 'Panda ♂' },
  { id: 'panda-f', src: avatarFemale1, label: 'Panda ♀' },
  { id: 'penguin-m', src: avatarMale2, label: 'Pinguim ♂' },
  { id: 'penguin-f', src: avatarFemale2, label: 'Pinguim ♀' },
  { id: 'fox-m', src: avatarMale3, label: 'Raposa ♂' },
  { id: 'fox-f', src: avatarFemale3, label: 'Raposa ♀' },
];


const GOAL_TYPE_LABELS: Record<string, string> = {
  nota_minima: 'Nota mínima',
  frequencia: 'Frequência',
  horas_estudo: 'Horas de estudo',
  atividades_concluidas: 'Atividades concluídas',
};

const GOAL_TYPE_ICONS: Record<string, string> = {
  nota_minima: '📊',
  frequencia: '📅',
  horas_estudo: '⏱️',
  atividades_concluidas: '✅',
};

const GoalCard = ({ goal, subjects, onSave, onDelete }: {
  goal: Goal;
  subjects: Subject[];
  onSave: (updates: Partial<Goal>) => Promise<void>;
  onDelete: () => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(goal.type);
  const [subjectId, setSubjectId] = useState(goal.subjectId || 'geral');
  const [targetValue, setTargetValue] = useState(goal.targetValue);

  const subjectName = subjects.find(s => s.id === goal.subjectId)?.name || 'Geral';
  const subjectColor = subjects.find(s => s.id === goal.subjectId)?.color;
  const progress = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;

  // Reset local state when goal changes
  useEffect(() => {
    setType(goal.type);
    setSubjectId(goal.subjectId || 'geral');
    setTargetValue(goal.targetValue);
  }, [goal]);

  if (!editing) {
    // READ-ONLY view
    return (
      <div className="rounded-xl border border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">{GOAL_TYPE_ICONS[goal.type] || '🎯'}</span>
            <div>
              <p className="text-xs font-semibold">{GOAL_TYPE_LABELS[goal.type] || goal.type}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {subjectColor && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subjectColor }} />}
                <span className="text-[10px] text-muted-foreground">{subjectName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-primary hover:underline px-2 py-1"
            >
              Editar
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-destructive hover:text-destructive/80 p-1">
                  <Trash2 size={12} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A meta "{GOAL_TYPE_LABELS[goal.type] || goal.type}" de {subjectName} será removida permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Progresso</span>
            <span className="font-medium">{goal.currentValue} / {goal.targetValue}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
    );
  }

  // EDIT mode
  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 space-y-3">
      <p className="text-xs font-semibold text-primary">Editando meta</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Tipo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nota_minima">Nota mín.</SelectItem>
              <SelectItem value="frequencia">Frequência</SelectItem>
              <SelectItem value="horas_estudo">Horas estudo</SelectItem>
              <SelectItem value="atividades_concluidas">Atividades</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Disciplina</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral</SelectItem>
              {subjects.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Alvo</Label>
          <Input type="number" className="h-8 text-xs" value={targetValue} onChange={e => setTargetValue(Number(e.target.value) || 0)} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={async () => {
            await onSave({
              type,
              subjectId: subjectId === 'geral' ? null : subjectId,
              targetValue,
            });
            setEditing(false);
          }}
        >
          <Save size={12} className="mr-1" /> Salvar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => {
            setType(goal.type);
            setSubjectId(goal.subjectId || 'geral');
            setTargetValue(goal.targetValue);
            setEditing(false);
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

interface ProfileViewProps {
  subjects: Subject[];
  activities: Activity[];
  attendance?: AttendanceRecord[];
}

const ProfileView = ({ subjects, activities, attendance = [] }: ProfileViewProps) => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals();
  const { courses, addCourse, updateCourse, deleteCourse } = useCourses();
  const { toast } = useToast();
  const { prefs: notifPrefs, updatePrefs: updateNotifPrefs, permissionGranted, enableNotifications } = useWebNotifications(subjects, activities);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showPwaTutorial, setShowPwaTutorial] = useState(false);
  const [pwaPlatform, setPwaPlatform] = useState<'ios' | 'android'>('ios');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const [addingCourse, setAddingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // New course form fields
  const [newCourseName, setNewCourseName] = useState('');
  const [newSemester, setNewSemester] = useState(1);
  const [newTargetGrade, setNewTargetGrade] = useState(7.0);
  const [newTargetAttendance, setNewTargetAttendance] = useState(75);
  const [newWeeklyHours, setNewWeeklyHours] = useState(20);

  // Legacy profile fields (keep for backward compat)
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState(1);
  const [targetGrade, setTargetGrade] = useState(7.0);
  const [targetAttendance, setTargetAttendance] = useState(75);
  const [weeklyHours, setWeeklyHours] = useState(20);

  useEffect(() => {
    if (profile) {
      setSelectedAvatar(profile.avatarUrl);
      setCourse(profile.course || '');
      setSemester(profile.currentSemester);
      setTargetGrade(profile.targetGrade);
      setTargetAttendance(profile.targetAttendance);
      setWeeklyHours(profile.weeklyHoursGoal);
    }
  }, [profile]);

  const completed = activities.filter(a => a.status === 'concluido').length;
  const totalWorkload = subjects.reduce((acc, s) => acc + s.workload, 0);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const currentAvatarSrc = AVATARS.find(a => a.id === selectedAvatar)?.src;

  const handleSelectAvatar = async (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setShowAvatarPicker(false);
    await updateProfile({ avatarUrl: avatarId });
    await supabase.auth.updateUser({ data: { avatar_url: avatarId } });
  };

  const handleSaveGoals = async () => {
    await updateProfile({
      course: course || null,
      currentSemester: semester,
      targetGrade,
      targetAttendance,
      weeklyHoursGoal: weeklyHours,
    });
    toast({ title: '✅ Metas salvas!', description: 'Suas metas foram atualizadas.' });
    setShowGoals(false);
  };

  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      profile: { course, semester, targetGrade, targetAttendance, weeklyHours },
      subjects: subjects,
      activities: activities,
      attendance: attendance,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uniflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: '📦 Backup JSON exportado!' });
    setShowExportOptions(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    let y = 20;

    doc.setFontSize(18);
    doc.text('Relatório Acadêmico', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Exportado em ${dateStr}`, 14, y);
    y += 12;

    // Profile info
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text('Perfil', 14, y); y += 7;
    doc.setFontSize(10);
    doc.text(`Nome: ${displayName}`, 14, y); y += 5;
    if (course) { doc.text(`Curso: ${course} · ${semester}º período`, 14, y); y += 5; }
    doc.text(`Meta de média: ${targetGrade} | Meta de frequência: ${targetAttendance}%`, 14, y); y += 10;

    // Subjects
    doc.setFontSize(13);
    doc.text('Disciplinas', 14, y); y += 7;
    doc.setFontSize(9);
    subjects.forEach(s => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`• ${s.name} — ${s.professor} (${s.type}, ${s.workload}h)`, 16, y);
      y += 5;
    });
    if (subjects.length === 0) { doc.text('Nenhuma disciplina cadastrada', 16, y); y += 5; }
    y += 5;

    // Activities
    doc.setFontSize(13);
    doc.text('Atividades', 14, y); y += 7;
    doc.setFontSize(9);
    const statusLabels: Record<string, string> = { pendente: 'Pendente', em_andamento: 'Em Andamento', concluido: 'Concluído' };
    activities.forEach(a => {
      if (y > 270) { doc.addPage(); y = 20; }
      const subj = subjects.find(s => s.id === a.subjectId);
      const status = statusLabels[a.status] || a.status;
      const grade = a.grade != null ? ` | Nota: ${a.grade}` : '';
      doc.text(`• ${a.title} [${status}] — ${subj?.name || ''}${grade}`, 16, y);
      y += 5;
    });
    if (activities.length === 0) { doc.text('Nenhuma atividade cadastrada', 16, y); y += 5; }
    y += 5;

    // Attendance summary
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.text('Frequência', 14, y); y += 7;
    doc.setFontSize(9);
    const totalAtt = attendance.length;
    const presentAtt = attendance.filter(r => r.present).length;
    const pct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
    doc.text(`Total: ${totalAtt} registros | Presenças: ${presentAtt} | ${pct}%`, 16, y);
    y += 8;

    // Per-subject attendance
    subjects.forEach(s => {
      if (y > 270) { doc.addPage(); y = 20; }
      const subAtt = attendance.filter(r => r.subjectId === s.id);
      const subPres = subAtt.filter(r => r.present).length;
      const subPct = subAtt.length > 0 ? Math.round((subPres / subAtt.length) * 100) : 0;
      doc.text(`  ${s.name}: ${subPres}/${subAtt.length} (${subPct}%)`, 16, y);
      y += 5;
    });

    doc.save(`uniflow-relatorio-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: '📄 PDF exportado!' });
    setShowExportOptions(false);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Estudante';

  const stats = [
    { icon: BookOpen, label: 'Disciplinas', value: subjects.length, color: 'text-primary' },
    { icon: CheckCircle2, label: 'Concluídas', value: completed, color: 'text-success' },
    { icon: Clock, label: 'Carga (h)', value: totalWorkload, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6 pb-4">
      <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>

      {/* Avatar & Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm"
      >
        <button
          onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 overflow-hidden ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
        >
          {currentAvatarSrc ? (
            <img src={currentAvatarSrc} alt="Avatar" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <User size={28} className="text-primary" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          {course && (
            <p className="text-xs text-primary mt-0.5">
              <GraduationCap size={10} className="inline mr-1" />
              {course} · {semester}º período
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <Select
              value={profile?.academicStatus || 'calouro'}
              onValueChange={async (v) => {
                await updateProfile({ academicStatus: v as AcademicStatus });
                toast({ title: '✅ Status atualizado!' });
              }}
            >
              <SelectTrigger className="h-6 w-auto text-[10px] px-2 py-0 border-primary/30 bg-primary/5 text-primary font-medium rounded-full gap-1 [&>svg]:h-3 [&>svg]:w-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calouro">🎓 Calouro</SelectItem>
                <SelectItem value="veterano">🏅 Veterano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="text-xs text-primary hover:underline mt-0.5"
          >
            Trocar avatar
          </button>
        </div>
      </motion.div>

      {/* Avatar Picker */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl bg-card p-4 shadow-sm overflow-hidden"
          >
            <p className="text-sm font-medium mb-3">Escolha seu avatar</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => handleSelectAvatar(avatar.id)}
                  className={`rounded-full overflow-hidden ring-2 transition-all ${
                    selectedAvatar === avatar.id ? 'ring-primary scale-110' : 'ring-transparent hover:ring-primary/30'
                  }`}
                >
                  <img src={avatar.src} alt={avatar.label} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl bg-card p-3 text-center shadow-sm">
            <stat.icon size={18} className={`mx-auto mb-1 ${stat.color}`} />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Academic Score - compact */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl bg-card p-4 shadow-sm"
      >
        <AcademicScore
          subjects={subjects}
          activities={activities}
          attendance={attendance}
          targetGrade={targetGrade}
          targetAttendance={targetAttendance}
          compact
        />
      </motion.div>

      {/* Plan Card */}
      <PlanCard subjects={subjects} />

      {/* Referral Section */}
      <ReferralSection />

      {/* Settings Group - iOS style */}
      <motion.div
        className="rounded-2xl bg-card shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Goals */}
        <button
          onClick={() => setShowGoals(!showGoals)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-sm hover:bg-secondary/60 transition-colors"
        >
          <Target size={18} className="text-muted-foreground" />
          <span className="flex-1 text-left">Curso & Metas</span>
          <span className="text-xs text-muted-foreground">
            {courses.length > 0 ? `${courses.length} curso${courses.length > 1 ? 's' : ''}` : 'Configurar'}
          </span>
          <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showGoals ? 'rotate-90' : ''}`} />
        </button>

        {/* Goals Panel - inline */}
        <AnimatePresence>
          {showGoals && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 pt-1 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <GraduationCap size={16} className="text-primary" /> Cursos & Metas Acadêmicas
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setNewCourseName('');
                      setNewSemester(1);
                      setNewTargetGrade(7);
                      setNewTargetAttendance(75);
                      setNewWeeklyHours(20);
                      setAddingCourse(true);
                      setEditingCourseId(null);
                    }}
                  >
                    <Plus size={12} className="mr-1" /> Novo Curso
                  </Button>
                </div>

                {/* Add / Edit Course Form */}
                {(addingCourse || editingCourseId) && (
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 space-y-3">
                    <p className="text-xs font-semibold text-primary">
                      {editingCourseId ? 'Editando curso' : 'Novo curso'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs">Nome do curso</Label>
                        <Input placeholder="Ex: Engenharia de Software" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Período atual</Label>
                        <Input type="number" min="1" max="20" value={newSemester} onChange={e => setNewSemester(Number(e.target.value) || 1)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Horas semanais</Label>
                        <Input type="number" min="1" max="80" value={newWeeklyHours} onChange={e => setNewWeeklyHours(Number(e.target.value) || 20)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Meta de média</Label>
                        <Input type="number" min="0" max="10" step="0.5" value={newTargetGrade} onChange={e => setNewTargetGrade(Number(e.target.value) || 7)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Meta de frequência (%)</Label>
                        <Input type="number" min="50" max="100" value={newTargetAttendance} onChange={e => setNewTargetAttendance(Number(e.target.value) || 75)} className="h-9" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        disabled={!newCourseName.trim()}
                        onClick={async () => {
                          if (editingCourseId) {
                            await updateCourse(editingCourseId, {
                              name: newCourseName.trim(),
                              currentSemester: newSemester,
                              weeklyHours: newWeeklyHours,
                              targetGrade: newTargetGrade,
                              targetAttendance: newTargetAttendance,
                            });
                            toast({ title: '✅ Curso atualizado!' });
                            setEditingCourseId(null);
                          } else {
                            await addCourse({
                              name: newCourseName.trim(),
                              currentSemester: newSemester,
                              weeklyHours: newWeeklyHours,
                              targetGrade: newTargetGrade,
                              targetAttendance: newTargetAttendance,
                            });
                            toast({ title: '✅ Curso adicionado!' });
                            setAddingCourse(false);
                          }
                        }}
                      >
                        <Save size={14} className="mr-1" /> {editingCourseId ? 'Salvar' : 'Adicionar'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setAddingCourse(false); setEditingCourseId(null); }}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Courses List */}
                {courses.length === 0 && !addingCourse && (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">Nenhum curso configurado</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Clique em "Novo Curso" para adicionar</p>
                  </div>
                )}

                {courses.map((c) => (
                  <div key={c.id} className="rounded-xl bg-secondary/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-primary" />
                        <span className="text-sm font-semibold">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setNewCourseName(c.name);
                            setNewSemester(c.currentSemester);
                            setNewWeeklyHours(c.weeklyHours);
                            setNewTargetGrade(c.targetGrade);
                            setNewTargetAttendance(c.targetAttendance);
                            setEditingCourseId(c.id);
                            setAddingCourse(false);
                          }}
                          className="text-xs text-primary hover:underline px-2 py-1"
                        >
                          Editar
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-destructive hover:text-destructive/80 p-1">
                              <Trash2 size={14} />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir curso?</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{c.name}" será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={async () => {
                                  await deleteCourse(c.id);
                                  toast({ title: '🗑️ Curso removido' });
                                }}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-card p-2 text-center">
                        <p className="text-lg font-bold">{c.currentSemester}º</p>
                        <p className="text-[10px] text-muted-foreground">Período</p>
                      </div>
                      <div className="rounded-lg bg-card p-2 text-center">
                        <p className="text-lg font-bold">{c.weeklyHours}h</p>
                        <p className="text-[10px] text-muted-foreground">Horas/semana</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-card p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Meta média</span>
                          <span className="text-xs font-bold text-primary">{c.targetGrade}</span>
                        </div>
                        <Progress value={(c.targetGrade / 10) * 100} className="h-1 mt-1" />
                      </div>
                      <div className="rounded-lg bg-card p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Meta frequência</span>
                          <span className="text-xs font-bold text-primary">{c.targetAttendance}%</span>
                        </div>
                        <Progress value={c.targetAttendance} className="h-1 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Multiple Goals Section */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Target size={14} className="text-primary" /> Metas Personalizadas
                      {goals.length > 0 && <span className="text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5">{goals.length}</span>}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={async () => {
                        await addGoal({
                          type: 'nota_minima',
                          targetValue: 7,
                          currentValue: 0,
                          subjectId: subjects.length > 0 ? subjects[0].id : null,
                          weekStart: null,
                        });
                        toast({ title: '✅ Meta adicionada!' });
                      }}
                    >
                      <Plus size={12} className="mr-1" /> Nova Meta
                    </Button>
                  </div>

                  {goals.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Nenhuma meta personalizada. Clique em "Nova Meta" para adicionar.
                    </p>
                  )}

                  {goals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      subjects={subjects}
                      onSave={async (updates) => {
                        await updateGoal(goal.id, updates);
                        toast({ title: '✅ Meta salva!' });
                      }}
                      onDelete={async () => {
                        await deleteGoal(goal.id);
                        toast({ title: '🗑️ Meta removida' });
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-4 border-t border-border" />

        {/* Notifications */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-sm hover:bg-secondary/60 transition-colors"
        >
          <Bell size={18} className="text-muted-foreground" />
          <span className="flex-1 text-left">Notificações</span>
          <span className="text-xs text-muted-foreground">
            {notifPrefs.deadlines || notifPrefs.classes || notifPrefs.reminders ? 'Ativado' : 'Desativado'}
          </span>
          <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showNotifications ? 'rotate-90' : ''}`} />
        </button>

        {/* Notifications Panel - inline */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 pt-1 space-y-4">
                {!permissionGranted && (
                  <button
                    onClick={async () => {
                      const granted = await enableNotifications();
                      if (granted) {
                        toast({ title: '🔔 Notificações ativadas!' });
                      } else {
                        toast({ title: '⚠️ Permissão negada', description: 'Habilite notificações nas configurações do navegador.', variant: 'destructive' });
                      }
                    }}
                    className="w-full rounded-xl bg-primary/10 border border-primary/20 p-3 text-center text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    🔔 Permitir notificações do navegador
                  </button>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarCheck size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm">Prazos de atividades</p>
                      <p className="text-[10px] text-muted-foreground">Alertas 24h, 6h e 1h antes</p>
                    </div>
                  </div>
                  <Switch checked={notifPrefs.deadlines} onCheckedChange={(v) => updateNotifPrefs({ deadlines: v })} />
                </div>

                <div className="border-t border-border" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BellRing size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm">Horário das aulas</p>
                      <p className="text-[10px] text-muted-foreground">Aviso 15min e 5min antes</p>
                    </div>
                  </div>
                  <Switch checked={notifPrefs.classes} onCheckedChange={(v) => updateNotifPrefs({ classes: v })} />
                </div>

                <div className="border-t border-border" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm">Resumo semanal</p>
                      <p className="text-[10px] text-muted-foreground">Resumo das atividades da semana</p>
                    </div>
                  </div>
                  <Switch checked={notifPrefs.reminders} onCheckedChange={(v) => updateNotifPrefs({ reminders: v })} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-4 border-t border-border" />

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-sm hover:bg-secondary/60 transition-colors"
        >
          {isDark ? <Sun size={18} className="text-muted-foreground" /> : <Moon size={18} className="text-muted-foreground" />}
          <span className="flex-1 text-left">Tema</span>
          <span className="text-xs text-muted-foreground">{isDark ? 'Escuro' : 'Claro'}</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        <div className="mx-4 border-t border-border" />

        {/* Export */}
        <button
          onClick={() => setShowExportOptions(!showExportOptions)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-sm hover:bg-secondary/60 transition-colors"
        >
          <Download size={18} className="text-muted-foreground" />
          <span className="flex-1 text-left">Backup / Exportar</span>
          <span className="text-xs text-muted-foreground">JSON · PDF</span>
          <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showExportOptions ? 'rotate-90' : ''}`} />
        </button>

        {/* Export Options - inline */}
        <AnimatePresence>
          {showExportOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 pt-1 space-y-2">
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Download size={18} className="text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">Backup JSON</p>
                    <p className="text-[10px] text-muted-foreground">Dados completos para restauração</p>
                  </div>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <FileDown size={18} className="text-destructive" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">Relatório PDF</p>
                    <p className="text-[10px] text-muted-foreground">Disciplinas, atividades e frequência</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-4 border-t border-border" />

        {/* Install App Tutorial */}
        <button
          onClick={() => setShowPwaTutorial(true)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-sm hover:bg-secondary/60 transition-colors"
        >
          <Smartphone size={18} className="text-muted-foreground" />
          <span className="flex-1 text-left">Instalar na tela inicial</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
      </motion.div>

      {/* Support Group - iOS style */}
      <motion.div
        className="rounded-2xl bg-card shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suporte</p>
        <a
          href="https://wa.me/5548996915303"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="flex-1 text-left">WhatsApp</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </a>
        <div className="mx-4 border-t border-border" />
        <a
          href="mailto:studyhakify@gmail.com"
          className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          <span className="flex-1 text-left">Email</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </a>
        <div className="mx-4 border-t border-border" />
        <a
          href="https://www.instagram.com/studyhakify/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
          </svg>
          <span className="flex-1 text-left">Instagram</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </a>
      </motion.div>

      {/* Logout */}
      <div className="flex justify-center py-2">
        <button
          onClick={signOut}
          className="group flex items-center justify-start w-11 h-11 bg-destructive rounded-full cursor-pointer relative overflow-hidden transition-all duration-200 shadow-lg hover:w-32 hover:rounded-full active:translate-x-1 active:translate-y-1"
        >
          <div className="flex items-center justify-center w-full transition-all duration-300 group-hover:justify-start group-hover:px-3">
            <LogOut size={16} className="text-destructive-foreground" />
          </div>
          <div className="absolute right-5 transform translate-x-full opacity-0 text-destructive-foreground text-sm font-semibold transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 whitespace-nowrap">
            Sair
          </div>
        </button>
      </div>


      {/* Subjects List */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Minhas Disciplinas</h2>
        <div className="space-y-2">
          {subjects.map(s => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
              <div className="flex-1">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{s.professor} · {s.type}</p>
              </div>
              <span className="text-xs text-muted-foreground">{s.workload}h</span>
            </div>
          ))}
          {subjects.length === 0 && (
            <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
              <p className="text-muted-foreground text-sm">Nenhuma disciplina cadastrada</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* PWA Install Tutorial Modal */}
      <AnimatePresence>
        {showPwaTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setShowPwaTutorial(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-card z-10 px-5 pt-5 pb-3 border-b border-border/40">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold">Instalar na tela inicial</h2>
                  <button onClick={() => setShowPwaTutorial(false)} className="rounded-full p-1.5 hover:bg-muted transition-colors">
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>
                {/* Platform toggle */}
                <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
                  <button
                    onClick={() => setPwaPlatform('ios')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                      pwaPlatform === 'ios' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    🍎 iPhone / iPad
                  </button>
                  <button
                    onClick={() => setPwaPlatform('android')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                      pwaPlatform === 'android' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    🤖 Android
                  </button>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                {pwaPlatform === 'ios' ? (
                  <>
                    <PwaTutorialStep
                      step={1}
                      emoji="🧭"
                      title="Abra no Safari"
                      description="O Study Hakify precisa ser aberto no navegador Safari para funcionar. Se estiver usando outro navegador, copie o link e cole no Safari."
                    />
                    <PwaTutorialStep
                      step={2}
                      emoji="📤"
                      title='Toque no botão "Compartilhar"'
                      description="Na barra inferior do Safari, toque no ícone de compartilhar (o quadrado com a seta para cima)."
                    />
                    <PwaTutorialStep
                      step={3}
                      emoji="➕"
                      title='"Adicionar à Tela de Início"'
                      description='Role as opções para baixo e toque em "Adicionar à Tela de Início". Se não aparecer, role mais para baixo.'
                    />
                    <PwaTutorialStep
                      step={4}
                      emoji="✏️"
                      title="Confirme o nome"
                      description='O nome "Study Hakify" vai aparecer. Toque em "Adicionar" no canto superior direito.'
                    />
                    <PwaTutorialStep
                      step={5}
                      emoji="🎉"
                      title="Pronto!"
                      description="O ícone do Study Hakify vai aparecer na sua tela inicial como um app de verdade. Toque nele para abrir!"
                    />
                  </>
                ) : (
                  <>
                    <PwaTutorialStep
                      step={1}
                      emoji="🌐"
                      title="Abra no Chrome"
                      description="Abra o Study Hakify no navegador Google Chrome. Se estiver em outro navegador, copie o link e cole no Chrome."
                    />
                    <PwaTutorialStep
                      step={2}
                      emoji="⋮"
                      title="Toque no menu (3 pontinhos)"
                      description='No canto superior direito do Chrome, toque nos três pontinhos verticais para abrir o menu.'
                    />
                    <PwaTutorialStep
                      step={3}
                      emoji="📲"
                      title='"Adicionar à tela inicial"'
                      description='No menu que abrir, toque em "Adicionar à tela inicial" ou "Instalar aplicativo".'
                    />
                    <PwaTutorialStep
                      step={4}
                      emoji="✅"
                      title="Confirme a instalação"
                      description='Toque em "Adicionar" ou "Instalar" para confirmar. O app será adicionado à sua tela inicial.'
                    />
                    <PwaTutorialStep
                      step={5}
                      emoji="🎉"
                      title="Pronto!"
                      description="O ícone do Study Hakify vai aparecer na sua tela inicial. Abra por ele para ter a melhor experiência, como um app nativo!"
                    />
                  </>
                )}

                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
                  <p className="text-xs text-primary font-medium text-center">
                    💡 Abrindo pelo ícone na tela inicial, o app funciona em tela cheia, sem barra de navegador, e carrega mais rápido!
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const ReferralSection = () => {
  const { referralCode, referrals, hasActivePlan, totalConverted, totalPending, monthsEarned, progressToNextReward, referralLink, loading } = useReferrals();
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  if (loading) return null;

  const nextMilestone = totalConverted < 30 ? 5 : 5;
  const progressPercent = (progressToNextReward / nextMilestone) * 100;
  const isAt30Bonus = totalConverted >= 25 && totalConverted < 30;

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: '📋 Link copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      await navigator.share({
        title: 'Study Hakify - Convite',
        text: 'Venha organizar seus estudos com o Study Hakify! Use meu link de indicação:',
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.17 }}
      className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-primary" />
            <div>
              <p className="text-sm font-bold">Indique & Ganhe</p>
              <p className="text-[10px] text-muted-foreground">
                {hasActivePlan ? 'Compartilhe seu link e ganhe meses grátis' : 'Assine um plano para ativar'}
              </p>
            </div>
          </div>
          {monthsEarned > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              +{monthsEarned} {monthsEarned === 1 ? 'mês' : 'meses'} ganhos
            </span>
          )}
        </div>

        {hasActivePlan ? (
          <>
            {/* Referral Link */}
            <div className="rounded-xl bg-muted/50 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Seu link de indicação</p>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-background border border-border px-3 py-2 text-[11px] font-mono truncate">
                  {referralLink}
                </div>
                <Button size="sm" variant="outline" className="h-8 px-2 shrink-0" onClick={handleCopy}>
                  {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </Button>
                <Button size="sm" className="h-8 px-2 shrink-0" onClick={handleShare}>
                  <Share2 size={14} />
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">
                  <Users size={10} className="inline mr-1" />
                  {totalConverted} indicação{totalConverted !== 1 ? 'ões' : ''} convertida{totalConverted !== 1 ? 's' : ''}
                  {totalPending > 0 && ` · ${totalPending} pendente${totalPending !== 1 ? 's' : ''}`}
                </span>
                <span className="font-semibold">
                  {progressToNextReward}/{nextMilestone} para +1 mês
                </span>
              </div>
              <Progress value={progressPercent} className="h-2 [&>div]:bg-primary" />
            </div>

            {/* 30 referrals bonus info */}
            {isAt30Bonus && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-2.5 text-center">
                <p className="text-xs font-semibold text-primary">🎉 Quase lá! Ao atingir 30 indicações você ganha 6 meses grátis!</p>
              </div>
            )}

            {/* Rules */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mx-auto"
            >
              Como funciona
              <ChevronRight size={10} className={`transition-transform ${showDetails ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl bg-muted/30 p-3 space-y-1.5 text-[10px] text-muted-foreground">
                    <p>✅ A cada <strong>5 amigos</strong> que assinarem, você ganha <strong>1 mês grátis</strong></p>
                    <p>🎯 Ao atingir <strong>30 indicações</strong>, você ganha <strong>6 meses grátis</strong></p>
                    <p>📲 Seu amigo precisa se cadastrar pelo seu link e assinar qualquer plano</p>
                    <p>⏱️ A indicação é contada quando o pagamento do amigo for aprovado</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="rounded-xl bg-muted/30 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Assine um plano mensal ou anual para ativar seu link de indicação e começar a ganhar meses grátis!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const PlanCard = ({ subjects }: { subjects: Subject[] }) => {
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const [showPlans, setShowPlans] = useState(false);

  const isActive = subscription.status === 'active';
  const isTrial = subscription.status === 'trial';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-primary" />
          <div>
            <p className="text-sm font-bold">
              {isActive ? 'Plano Ativo' : isTrial ? 'Teste Grátis' : 'Plano Gratuito'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isActive
                ? subscription.periodEnd
                  ? `Expira em ${Math.max(0, Math.ceil((new Date(subscription.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} dias`
                  : 'Todas as funcionalidades'
                : isTrial && subscription.daysLeft !== undefined
                  ? `${subscription.daysLeft} dias restantes`
                  : 'Funcionalidades básicas'}
            </p>
          </div>
        </div>
        {!isActive && (
          <button
            onClick={() => setShowPlans(!showPlans)}
            className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground"
          >
            <Sparkles size={10} /> Upgrade
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPlans && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2">
              {/* Annual */}
              <button
                onClick={() => navigate('/checkout?plan=yearly')}
                className="w-full rounded-xl border-2 border-primary/40 bg-primary/10 p-3 text-left transition-all hover:border-primary/60 hover:bg-primary/15"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">Plano Anual</p>
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">-34%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">R$ 16,42/mês • Economize R$ 101,80</p>
                  </div>
                  <p className="text-lg font-extrabold">R$ 197<span className="text-xs font-normal text-muted-foreground">/ano</span></p>
                </div>
              </button>

              {/* Monthly */}
              <button
                onClick={() => navigate('/checkout?plan=monthly')}
                className="w-full rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/30 hover:bg-secondary"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Plano Mensal</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Cobrança mensal</p>
                  </div>
                  <p className="text-lg font-extrabold">R$ 24,90<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 space-y-1.5">
        {(isActive && subscription.periodEnd) && (() => {
          const daysLeft = Math.max(0, Math.ceil((new Date(subscription.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          const totalDays = subscription.periodEnd && subscription.periodEnd
            ? Math.ceil((new Date(subscription.periodEnd).getTime() - new Date(subscription.periodEnd).getTime()) / (1000 * 60 * 60 * 24)) || (daysLeft > 60 ? 365 : 30)
            : 30;
          const pct = Math.min((daysLeft / totalDays) * 100, 100);
          return (
            <div className="flex items-center gap-2 text-[10px]">
              <Clock size={10} className="text-muted-foreground" />
              <span className="text-muted-foreground">{daysLeft} dias restantes</span>
              <Progress value={pct} className="flex-1 h-1.5 [&>div]:bg-primary" />
            </div>
          );
        })()}
        {isTrial && subscription.daysLeft !== undefined && (
          <div className="flex items-center gap-2 text-[10px]">
            <Clock size={10} className="text-muted-foreground" />
            <span className="text-muted-foreground">{subscription.daysLeft} dias restantes</span>
            <Progress value={(subscription.daysLeft / 7) * 100} className="flex-1 h-1.5 [&>div]:bg-amber-500" />
          </div>
        )}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Uso de recursos</span>
          <span className="font-medium">{subjects.length} disciplinas</span>
        </div>
        <Progress value={Math.min((subjects.length / 10) * 100, 100)} className="h-1.5 [&>div]:bg-primary" />
      </div>
    </motion.div>
  );
};

const PwaTutorialStep = ({ step, emoji, title, description }: { step: number; emoji: string; title: string; description: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: step * 0.05 }}
    className="flex gap-3"
  >
    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-black text-primary">
      {step}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold flex items-center gap-1.5">
        <span>{emoji}</span> {title}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export default ProfileView;
