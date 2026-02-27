import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  status: string;
  rewardGranted: boolean;
  createdAt: string;
  convertedAt: string | null;
}

export function useReferrals() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const hasNotified = useRef(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Get referral code from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setReferralCode((profile as any).referral_code);
    }

    // Check if user has active subscription (paid)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();

    setHasActivePlan(sub?.status === 'active');

    // Get referrals where user is the referrer
    const { data: refs } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (refs) {
      setReferrals(refs.map((r: any) => ({
        id: r.id,
        referrerId: r.referrer_id,
        referredId: r.referred_id,
        status: r.status,
        rewardGranted: r.reward_granted,
        createdAt: r.created_at,
        convertedAt: r.converted_at,
      })));
    }

    // Check for new conversions and notify
    const convertedCount = (refs || []).filter((r: any) => r.status === 'converted').length;
    const storageKey = `referral_seen_${user.id}`;
    const lastSeen = parseInt(localStorage.getItem(storageKey) || '0', 10);

    if (!hasNotified.current && convertedCount > lastSeen) {
      const newConversions = convertedCount - lastSeen;
      hasNotified.current = true;
      toast({
        title: '🎉 Indicação convertida!',
        description: newConversions === 1
          ? 'Um amigo indicado assinou o plano! Confira suas recompensas.'
          : `${newConversions} amigos indicados assinaram o plano! Confira suas recompensas.`,
      });
    }
    localStorage.setItem(storageKey, String(convertedCount));

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalConverted = referrals.filter(r => r.status === 'converted').length;
  const totalPending = referrals.filter(r => r.status === 'pending').length;

  // Calculate rewards
  const monthsEarned = totalConverted >= 30
    ? 6 + Math.floor((totalConverted - 30) / 5)
    : Math.floor(totalConverted / 5);

  const nextRewardAt = totalConverted >= 30
    ? (Math.floor((totalConverted - 30) / 5) + 1) * 5 + 30
    : (Math.floor(totalConverted / 5) + 1) * 5;

  const progressToNextReward = totalConverted >= 30
    ? ((totalConverted - 30) % 5)
    : (totalConverted % 5);

  const referralLink = referralCode
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : null;

  return {
    referralCode,
    referrals,
    loading,
    hasActivePlan,
    totalConverted,
    totalPending,
    monthsEarned,
    nextRewardAt,
    progressToNextReward,
    referralLink,
    refetch: fetchData,
  };
}
