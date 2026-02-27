import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AdminUser {
  userId: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  course: string | null;
  currentSemester: number | null;
  createdAt: string;
  subjectsCount?: number;
  activitiesCount?: number;
  notesCount?: number;
  subscription?: {
    status: string;
    trialStart: string;
    trialEnd: string;
    periodStart: string | null;
    periodEnd: string | null;
    mpPayerEmail: string | null;
    mpSubscriptionId: string | null;
  } | null;
}

export interface AdminPayment {
  id: string;
  userId: string;
  mpPaymentId: string;
  status: string;
  statusDetail: string | null;
  paymentMethod: string | null;
  paymentType: string | null;
  transactionAmount: number;
  payerEmail: string | null;
  description: string | null;
  createdAt: string;
  displayName?: string | null;
  userEmail?: string | null;
}

export interface AdminReferralData {
  id: string;
  referrerId: string;
  referredId: string;
  status: string;
  rewardGranted: boolean;
  createdAt: string;
  convertedAt: string | null;
  referrerName?: string | null;
  referrerEmail?: string | null;
  referredName?: string | null;
  referredEmail?: string | null;
}

export interface AdminMetrics {
  totalUsers: number;
  activeTrials: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  newUsersThisWeek: number;
  newUsersLastWeek: number;
}

export interface AuditLog {
  id: string;
  adminUserId: string;
  action: string;
  targetUserId: string | null;
  targetTable: string | null;
  targetId: string | null;
  details: Record<string, any>;
  createdAt: string;
  adminName?: string | null;
  targetName?: string | null;
}

export function useAdmin() {
  const { user, isLoading: authLoading } = useAuth();

  const logAudit = async (action: string, targetUserId?: string, targetTable?: string, targetId?: string, details?: Record<string, any>) => {
    if (!user) return;
    try {
      await supabase.from('audit_logs' as any).insert({
        admin_user_id: user.id,
        action,
        target_user_id: targetUserId || null,
        target_table: targetTable || null,
        target_id: targetId || null,
        details: details || {},
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }
  };
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [referrals, setReferrals] = useState<AdminReferralData[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  const checkAdmin = useCallback(async () => {
    if (authLoading) return; // wait for auth to finish
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [user, authLoading]);

  useEffect(() => { checkAdmin(); }, [checkAdmin]);

  const fetchUsers = useCallback(async () => {
    if (!user || !isAdmin) return;

    const [{ data: profiles }, { data: subscriptions }, { data: subjects }, { data: activities }, { data: notes }, { data: paymentsData }, { data: referralsData }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*'),
      supabase.from('subjects').select('user_id'),
      supabase.from('activities').select('user_id'),
      supabase.from('notes').select('user_id'),
      supabase.from('payments' as any).select('*').order('created_at', { ascending: false }),
      supabase.from('referrals').select('*').order('created_at', { ascending: false }),
    ]);

    const subMap = new Map((subscriptions || []).map((s: any) => [s.user_id, s]));

    // Count per user
    const countBy = (arr: any[] | null) => {
      const map = new Map<string, number>();
      (arr || []).forEach((r: any) => map.set(r.user_id, (map.get(r.user_id) || 0) + 1));
      return map;
    };
    const subjectsMap = countBy(subjects);
    const activitiesMap = countBy(activities);
    const notesMap = countBy(notes);

    const mappedUsers: AdminUser[] = (profiles || []).map((p: any) => {
      const sub = subMap.get(p.user_id);
      return {
        userId: p.user_id,
        displayName: p.display_name,
        email: p.email,
        avatarUrl: p.avatar_url,
        course: p.course,
        currentSemester: p.current_semester,
        createdAt: p.created_at,
        subjectsCount: subjectsMap.get(p.user_id) || 0,
        activitiesCount: activitiesMap.get(p.user_id) || 0,
        notesCount: notesMap.get(p.user_id) || 0,
        subscription: sub ? {
          status: sub.status,
          trialStart: sub.trial_start,
          trialEnd: sub.trial_end,
          periodStart: sub.current_period_start,
          periodEnd: sub.current_period_end,
          mpPayerEmail: sub.mp_payer_email,
          mpSubscriptionId: sub.mp_subscription_id,
        } : null,
      };
    });

    setUsers(mappedUsers);

    // Map payments with user info
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    const mappedPayments: AdminPayment[] = (paymentsData || []).map((p: any) => {
      const profile = profileMap.get(p.user_id);
      return {
        id: p.id,
        userId: p.user_id,
        mpPaymentId: p.mp_payment_id,
        status: p.status,
        statusDetail: p.status_detail,
        paymentMethod: p.payment_method,
        paymentType: p.payment_type,
        transactionAmount: p.transaction_amount,
        payerEmail: p.payer_email,
        description: p.description,
        createdAt: p.created_at,
        displayName: profile?.display_name || null,
        userEmail: profile?.email || null,
      };
    });
    setPayments(mappedPayments);

    // Map referrals with user info
    const mappedReferrals: AdminReferralData[] = (referralsData || []).map((r: any) => {
      const referrer = profileMap.get(r.referrer_id);
      const referred = profileMap.get(r.referred_id);
      return {
        id: r.id,
        referrerId: r.referrer_id,
        referredId: r.referred_id,
        status: r.status,
        rewardGranted: r.reward_granted,
        createdAt: r.created_at,
        convertedAt: r.converted_at,
        referrerName: referrer?.display_name || null,
        referrerEmail: referrer?.email || null,
        referredName: referred?.display_name || null,
        referredEmail: referred?.email || null,
      };
    });
    setReferrals(mappedReferrals);

    // Calculate metrics
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const totalUsers = mappedUsers.length;
    const activeTrials = mappedUsers.filter(u => u.subscription?.status === 'trial').length;
    const activeSubscriptions = mappedUsers.filter(u => u.subscription?.status === 'active').length;
    const expiredSubscriptions = mappedUsers.filter(u => u.subscription?.status === 'expired').length;
    const newUsersThisWeek = mappedUsers.filter(u => new Date(u.createdAt) >= weekAgo).length;
    const newUsersLastWeek = mappedUsers.filter(u => {
      const d = new Date(u.createdAt);
      return d >= twoWeeksAgo && d < weekAgo;
    }).length;

    setMetrics({ totalUsers, activeTrials, activeSubscriptions, expiredSubscriptions, newUsersThisWeek, newUsersLastWeek });
  }, [user, isAdmin]);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin, fetchUsers]);

  const updateSubscriptionStatus = async (userId: string, status: string) => {
    await supabase
      .from('subscriptions')
      .update({ status } as any)
      .eq('user_id', userId);
    await logAudit('update_subscription_status', userId, 'subscriptions', undefined, { new_status: status });
    await fetchUsers();
  };

  const extendTrial = async (userId: string, days: number) => {
    const sub = users.find(u => u.userId === userId)?.subscription;
    if (!sub) return;
    const currentEnd = new Date(sub.trialEnd);
    currentEnd.setDate(currentEnd.getDate() + days);
    await supabase
      .from('subscriptions')
      .update({ trial_end: currentEnd.toISOString(), status: 'trial' } as any)
      .eq('user_id', userId);
    await logAudit('extend_trial', userId, 'subscriptions', undefined, { days_added: days, new_end: currentEnd.toISOString() });
    await fetchUsers();
  };

  const removeSubscription = async (userId: string) => {
    await supabase
      .from('subscriptions')
      .update({ status: 'expired', current_period_end: new Date().toISOString() } as any)
      .eq('user_id', userId);
    await logAudit('remove_subscription', userId, 'subscriptions', undefined, { action: 'expired' });
    await fetchUsers();
  };

  const grantPlan = async (userId: string, durationDays: number) => {
    const now = new Date();
    const end = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const existing = users.find(u => u.userId === userId)?.subscription;
    if (existing) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
        } as any)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          trial_start: now.toISOString(),
          trial_end: now.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
        } as any);
    }
    await logAudit('grant_plan', userId, 'subscriptions', undefined, { duration_days: durationDays, period_end: end.toISOString() });
    await fetchUsers();
  };

  const grantTrial = async (userId: string, days: number) => {
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const existing = users.find(u => u.userId === userId)?.subscription;
    if (existing) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'trial',
          trial_start: now.toISOString(),
          trial_end: end.toISOString(),
        } as any)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'trial',
          trial_start: now.toISOString(),
          trial_end: end.toISOString(),
        } as any);
    }
    await logAudit('grant_trial', userId, 'subscriptions', undefined, { days, trial_end: end.toISOString() });
    await fetchUsers();
  };


  const deleteUser = async (userId: string) => {
    const targetUser = users.find(u => u.userId === userId);
    await Promise.all([
      supabase.from('chat_messages').delete().eq('user_id', userId),
      supabase.from('attendance').delete().eq('user_id', userId),
      supabase.from('goals').delete().eq('user_id', userId),
      supabase.from('materials').delete().eq('user_id', userId),
      supabase.from('notes').delete().eq('user_id', userId),
      supabase.from('referrals').delete().eq('referrer_id', userId),
      supabase.from('referrals').delete().eq('referred_id', userId),
      supabase.from('payments' as any).delete().eq('user_id', userId),
    ]);

    await supabase.from('activities').delete().eq('user_id', userId);
    await supabase.from('subjects').delete().eq('user_id', userId);
    await supabase.from('chat_conversations').delete().eq('user_id', userId);
    await supabase.from('courses').delete().eq('user_id', userId);
    await supabase.from('subscriptions').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);

    await logAudit('delete_user', userId, 'profiles', userId, {
      deleted_name: targetUser?.displayName || null,
      deleted_email: targetUser?.email || null,
    });
    await fetchUsers();
  };
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const fetchAuditLogs = useCallback(async () => {
    if (!user || !isAdmin) return;
    const { data } = await supabase
      .from('audit_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, email');
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const mapped: AuditLog[] = (data || []).map((l: any) => ({
      id: l.id,
      adminUserId: l.admin_user_id,
      action: l.action,
      targetUserId: l.target_user_id,
      targetTable: l.target_table,
      targetId: l.target_id,
      details: l.details || {},
      createdAt: l.created_at,
      adminName: profileMap.get(l.admin_user_id)?.display_name || profileMap.get(l.admin_user_id)?.email || l.admin_user_id,
      targetName: l.target_user_id ? (profileMap.get(l.target_user_id)?.display_name || profileMap.get(l.target_user_id)?.email || l.target_user_id) : null,
    }));
    setAuditLogs(mapped);
  }, [user, isAdmin]);

  useEffect(() => { if (isAdmin) fetchAuditLogs(); }, [isAdmin, fetchAuditLogs]);

  return {
    isAdmin, loading, users, payments, referrals, metrics, auditLogs, fetchUsers, fetchAuditLogs,
    updateSubscriptionStatus, extendTrial, removeSubscription,
    grantPlan, grantTrial, deleteUser,
  };
}
