import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import CheckoutBricks from '@/components/CheckoutBricks';

export type PlanType = 'monthly' | 'yearly';

export const PLANS = {
  monthly: { label: 'Plano Mensal', amount: 24.9, period: '/mês', months: 1 },
  yearly: { label: 'Plano Anual', amount: 197, period: '/ano', months: 12 },
} as const;

const Checkout = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = (searchParams.get('plan') as PlanType) || 'monthly';
  const selectedPlan = PLANS[plan] || PLANS.monthly;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth?plan=monthly', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return (
      <div ref={ref} className="hakify-auth-bg flex items-center justify-center">
        <div className="animate-pulse text-white/50">Carregando...</div>
      </div>
    );
  }

  return (
    <div ref={ref}>
      <CheckoutBricks
        plan={plan}
        planLabel={selectedPlan.label}
        amount={selectedPlan.amount}
        periodLabel={selectedPlan.period}
        months={selectedPlan.months}
        onClose={() => navigate('/')}
        onSuccess={() => navigate('/')}
      />
    </div>
  );
});

Checkout.displayName = 'Checkout';

export default Checkout;
