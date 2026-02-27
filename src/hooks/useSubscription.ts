import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SubscriptionData {
  status: 'trial' | 'active' | 'expired' | 'loading';
  hasAccess: boolean;
  daysLeft?: number;
  trialEnd?: string;
  periodEnd?: string;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    status: 'loading',
    hasAccess: true,
  });
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user || !session) return;
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setSubscription({
        status: data.status,
        hasAccess: data.hasAccess,
        daysLeft: data.daysLeft,
        trialEnd: data.trialEnd,
        periodEnd: data.periodEnd,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      // Default to allowing access on error to not block users
      setSubscription({ status: 'trial', hasAccess: true });
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const createCheckout = async () => {
    if (!session) return;
    try {
      const returnUrl = window.location.origin;
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { returnUrl },
      });
      if (error) throw error;
      // Open in new tab (works in iframes) with fallback to redirect
      const checkoutUrl = data.init_point;
      const newWindow = window.open(checkoutUrl, '_blank');
      if (!newWindow) {
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      throw err;
    }
  };

  return { subscription, loading, createCheckout, refetch: checkSubscription };
}
