import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Flame, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type PlanType = 'monthly' | 'yearly';

const plans = {
  monthly: {
    label: 'Mensal',
    price: 'R$ 24,90',
    period: '/mês',
  },
  yearly: {
    label: 'Anual',
    price: 'R$ 197',
    period: '/ano',
    badge: 'Economize R$ 101,80',
  },
} as const;

const Paywall = () => {
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlanType>('yearly');
  const [dismissed, setDismissed] = useState(false);

  if (subscription.hasAccess || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-b border-amber-500/30 px-4 py-3"
    >
      <div className="max-w-lg mx-auto space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Seu plano expirou</p>
              <p className="text-xs text-muted-foreground">Você pode visualizar seus dados, mas não adicionar novos itens.</p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelected('monthly')}
            className={cn(
              'flex-1 rounded-xl border px-3 py-2 text-left transition-all text-xs',
              selected === 'monthly'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card/50'
            )}
          >
            <span className="font-semibold text-foreground">{plans.monthly.price}</span>
            <span className="text-muted-foreground">{plans.monthly.period}</span>
          </button>
          <button
            onClick={() => setSelected('yearly')}
            className={cn(
              'flex-1 rounded-xl border px-3 py-2 text-left transition-all text-xs relative',
              selected === 'yearly'
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-border bg-card/50'
            )}
          >
            <span className="font-semibold text-foreground">{plans.yearly.price}</span>
            <span className="text-muted-foreground">{plans.yearly.period}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/checkout?plan=${selected}`)}
            size="sm"
            className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0 text-xs font-semibold"
          >
            Renovar plano
          </Button>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
            <ShieldCheck size={10} />
            Mercado Pago
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Paywall;
