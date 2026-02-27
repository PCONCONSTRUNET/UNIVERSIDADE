import { useState, useCallback, useEffect } from 'react';
import { TabId, Subject, Activity, Note } from '@/types/uniflow';
import { useAuth } from '@/hooks/useAuth';
import { useSubjects, useActivities, useNotes, useAttendance } from '@/hooks/useSupabaseData';
import { useProfile } from '@/hooks/useProfile';
import { Navigate, useSearchParams } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import StudyChat from '@/components/StudyChat';
import DashboardView from '@/components/views/DashboardView';
import ScheduleView from '@/components/views/ScheduleView';
import ActivitiesView from '@/components/views/ActivitiesView';
import NotesView from '@/components/views/NotesView';
import AttendanceView from '@/components/views/AttendanceView';
import GradesView from '@/components/views/GradesView';
import ProfileView from '@/components/views/ProfileView';
import GroupsView from '@/components/views/GroupsView';
import MaterialsView from '@/components/views/MaterialsView';
import AddSubjectDrawer from '@/components/AddSubjectDrawer';
import AddActivityDrawer from '@/components/AddActivityDrawer';
import AddNoteDrawer from '@/components/AddNoteDrawer';
import QuickClassNote from '@/components/QuickClassNote';
import { AnimatePresence, motion } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import Paywall from '@/components/Paywall';
import { Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import OnboardingTour from '@/components/OnboardingTour';
import { useWebNotifications } from '@/hooks/useWebNotifications';

const Index = () => {
  const { user, isLoading: authLoading, session } = useAuth();
  const { subscription, createCheckout } = useSubscription();
  const canAdd = subscription.hasAccess;
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [selectedDayForSubject, setSelectedDayForSubject] = useState<number>(1);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const alreadyDone = localStorage.getItem('uniflow_onboarding_done');
    if (!alreadyDone) {
      localStorage.setItem('uniflow_onboarding_done', 'true');
      return true;
    }
    return false;
  });
  const { subjects, addSubject, deleteSubject } = useSubjects();
  const { activities, addActivity, toggleStatus, deleteActivity, updateActivity } = useActivities();
  const { notes, addNote, deleteNote, updateNote, reorderNotes } = useNotes();
  const { attendance, markAttendance } = useAttendance();
  const { profile } = useProfile();
  useWebNotifications(subjects, activities);

  // Auto-trigger checkout when coming from auth with a plan param
  useEffect(() => {
    const plan = searchParams.get('plan');
    if ((plan === 'monthly' || plan === 'yearly') && session) {
      setSearchParams({}, { replace: true });
      // Navigate to the custom checkout page instead of Mercado Pago redirect
      window.location.href = `/checkout?plan=${plan}`;
    }
  }, [searchParams, session, setSearchParams]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  const guardAdd = (action: () => void) => {
    if (!canAdd) {
      toast.error('Renove seu plano para adicionar novos itens');
      return;
    }
    action();
  };

  const handleAddSubject = async (subject: Subject) => {
    const { id, ...rest } = subject;
    await addSubject(rest);
  };

  const handleAddActivity = async (activity: Activity) => {
    const { id, ...rest } = activity;
    await addActivity(rest);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView subjects={subjects} activities={activities} attendance={attendance} notes={notes} onOpenChat={() => setChatOpen(true)} displayName={profile?.displayName} weeklyHoursGoal={profile?.weeklyHoursGoal ?? 20} />;
      case 'schedule':
        return <ScheduleView subjects={subjects} activities={activities} onAddSubject={(day) => guardAdd(() => { setSelectedDayForSubject(day); setShowAddSubject(true); })} onDeleteSubject={deleteSubject} />;
      case 'activities':
        return (
          <ActivitiesView
            activities={activities}
            subjects={subjects}
            attendance={attendance}
            onToggleStatus={toggleStatus}
            onAddActivity={() => guardAdd(() => setShowAddActivity(true))}
            onDeleteActivity={deleteActivity}
            onUpdateActivity={updateActivity}
          />
        );
      case 'grades':
        return <GradesView activities={activities} subjects={subjects} targetGrade={profile?.targetGrade ?? 7.0} />;
      case 'attendance':
        return <AttendanceView subjects={subjects} attendance={attendance} onMarkAttendance={markAttendance} />;
      case 'notes':
        return <NotesView notes={notes} subjects={subjects} onAddNote={() => guardAdd(() => setShowAddNote(true))} onDeleteNote={deleteNote} onEditNote={(note) => { setEditingNote(note); setShowAddNote(true); }} onReorder={reorderNotes} />;
      case 'groups':
        return <GroupsView subjects={subjects} />;
      case 'materials':
        return <MaterialsView subjects={subjects} />;
      case 'profile':
        return <ProfileView subjects={subjects} activities={activities} attendance={attendance} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Paywall />
      {showOnboarding && (
        <OnboardingTour onComplete={() => {
          localStorage.setItem('uniflow_onboarding_done', 'true');
          setShowOnboarding(false);
        }} />
      )}
      {subscription.status === 'trial' && subscription.daysLeft !== undefined && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-foreground">
            Teste grátis: <strong>{subscription.daysLeft} dias restantes</strong>
          </span>
        </div>
      )}
      <main className="mx-auto max-w-lg px-4 pt-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <StudyChat subjects={subjects} activities={activities} attendance={attendance} externalOpen={chatOpen} onExternalOpenChange={setChatOpen} academicStatus={profile?.academicStatus} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <AddSubjectDrawer
        open={showAddSubject}
        onOpenChange={setShowAddSubject}
        onAdd={handleAddSubject}
        defaultDay={selectedDayForSubject}
      />
      <AddActivityDrawer
        open={showAddActivity}
        onOpenChange={setShowAddActivity}
        onAdd={handleAddActivity}
        subjects={subjects}
      />
      <AddNoteDrawer
        open={showAddNote}
        onOpenChange={(open) => { setShowAddNote(open); if (!open) setEditingNote(null); }}
        onAdd={addNote}
        onUpdate={updateNote}
        onDelete={deleteNote}
        editingNote={editingNote}
        subjects={subjects}
      />
      <QuickClassNote
        open={showQuickNote}
        onOpenChange={setShowQuickNote}
        subjects={subjects}
        onSaveAsNote={addNote}
        onSaveAsActivity={async (activity) => {
          await addActivity(activity);
        }}
      />

      {/* Floating Quick Note Button */}
      <button
        onClick={() => guardAdd(() => setShowQuickNote(true))}
        className="fixed right-4 bottom-40 z-40 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Anotação rápida de aula"
      >
        <Zap className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Index;
