import { useEffect, useCallback, useRef, useState } from 'react';
import { Subject, Activity, Schedule, DAY_LABELS_FULL } from '@/types/uniflow';

interface NotificationPrefs {
  deadlines: boolean;
  classes: boolean;
  reminders: boolean;
}

const PREFS_KEY = 'uniflow_notif_prefs';
const NOTIFIED_KEY = 'uniflow_notified_ids';

function getPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { deadlines: true, classes: true, reminders: false };
}

function savePrefs(prefs: NotificationPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function getNotifiedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function addNotified(id: string) {
  const set = getNotifiedSet();
  set.add(id);
  // Keep only last 200 entries
  const arr = Array.from(set).slice(-200);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr));
}

async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function showNotification(title: string, body: string, icon?: string) {
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: icon || '/pwa-icon-512.png',
      badge: '/favicon.ico',
      silent: false,
    });
  } catch {
    // Fallback: some browsers don't support Notification constructor
  }
}

export function useWebNotifications(subjects: Subject[], activities: Activity[]) {
  const [prefs, setPrefsState] = useState<NotificationPrefs>(getPrefs);
  const [permissionGranted, setPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updatePrefs = useCallback((updates: Partial<NotificationPrefs>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...updates };
      savePrefs(next);
      return next;
    });
  }, []);

  const enableNotifications = useCallback(async () => {
    const granted = await requestPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  // Check for deadline notifications
  const checkDeadlines = useCallback(() => {
    if (!prefs.deadlines || !permissionGranted) return;
    const now = Date.now();
    const notified = getNotifiedSet();

    activities.forEach(activity => {
      if (activity.status === 'concluido') return;
      const deadline = new Date(activity.deadline).getTime();
      const hoursLeft = (deadline - now) / (1000 * 60 * 60);

      // Notify at 24h, 6h, 1h before deadline
      const thresholds = [
        { hours: 24, label: '24 horas', id: `deadline-24h-${activity.id}` },
        { hours: 6, label: '6 horas', id: `deadline-6h-${activity.id}` },
        { hours: 1, label: '1 hora', id: `deadline-1h-${activity.id}` },
      ];

      for (const t of thresholds) {
        if (hoursLeft <= t.hours && hoursLeft > t.hours - 0.5 && !notified.has(t.id)) {
          const subject = subjects.find(s => s.id === activity.subjectId);
          showNotification(
            `⏰ ${activity.title}`,
            `Faltam ${t.label} para o prazo! ${subject ? `(${subject.name})` : ''}`,
          );
          addNotified(t.id);
        }
      }

      // Overdue
      const overdueId = `deadline-overdue-${activity.id}`;
      if (hoursLeft < 0 && hoursLeft > -1 && !notified.has(overdueId)) {
        const subject = subjects.find(s => s.id === activity.subjectId);
        showNotification(
          `🚨 Prazo expirado!`,
          `\"${activity.title}\" está atrasada! ${subject ? `(${subject.name})` : ''}`,
        );
        addNotified(overdueId);
      }
    });
  }, [prefs.deadlines, permissionGranted, activities, subjects]);

  // Check for upcoming class notifications
  const checkClasses = useCallback(() => {
    if (!prefs.classes || !permissionGranted) return;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const notified = getNotifiedSet();
    const today = now.toISOString().split('T')[0];

    subjects.forEach(subject => {
      subject.schedules.forEach((schedule: Schedule) => {
        if (schedule.day !== dayOfWeek) return;
        const [h, m] = schedule.startTime.split(':').map(Number);
        const classMinutes = h * 60 + m;
        const minutesUntil = classMinutes - currentMinutes;

        // Notify 15 minutes before class
        const id15 = `class-15m-${subject.id}-${schedule.day}-${schedule.startTime}-${today}`;
        if (minutesUntil <= 15 && minutesUntil > 10 && !notified.has(id15)) {
          showNotification(
            `📚 ${subject.name} em 15min`,
            `${schedule.startTime} — ${subject.location || 'Sem local definido'}`,
          );
          addNotified(id15);
        }

        // Notify 5 minutes before class
        const id5 = `class-5m-${subject.id}-${schedule.day}-${schedule.startTime}-${today}`;
        if (minutesUntil <= 5 && minutesUntil > 0 && !notified.has(id5)) {
          showNotification(
            `🏃 ${subject.name} começa agora!`,
            `${schedule.startTime} — ${subject.location || 'Sem local definido'}`,
          );
          addNotified(id5);
        }
      });
    });
  }, [prefs.classes, permissionGranted, subjects]);

  // Set up periodic checks every 60 seconds
  useEffect(() => {
    if (!permissionGranted) return;

    const runChecks = () => {
      checkDeadlines();
      checkClasses();
    };

    // Run immediately
    runChecks();

    // Then every 60 seconds
    intervalRef.current = setInterval(runChecks, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [permissionGranted, checkDeadlines, checkClasses]);

  // Clean up old notified IDs daily
  useEffect(() => {
    const lastClean = localStorage.getItem('uniflow_notif_last_clean');
    const today = new Date().toISOString().split('T')[0];
    if (lastClean !== today) {
      localStorage.removeItem(NOTIFIED_KEY);
      localStorage.setItem('uniflow_notif_last_clean', today);
    }
  }, []);

  return {
    prefs,
    updatePrefs,
    permissionGranted,
    enableNotifications,
  };
}
