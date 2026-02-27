import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Crown, Clock, XCircle, ChevronDown, ChevronUp, Gift, CalendarPlus, Ban, RefreshCw } from 'lucide-react';
import { AdminUser } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';

interface Props {
  users: AdminUser[];
  onGrantPlan?: (userId: string, days: number) => Promise<void>;
  onGrantTrial?: (userId: string, days: number) => Promise<void>;
  onExtendTrial?: (userId: string, days: number) => Promise<void>;
  onRemoveSubscription?: (userId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const AdminSubscriptions = ({ users, onGrantPlan, onGrantTrial, onExtendTrial, onRemoveSubscription, onRefresh }: Props) => {
  const { toast } = useToast();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const activeUsers = users.filter(u => u.subscription?.status === 'active');
  const trialUsers = users.filter(u => u.subscription?.status === 'trial');
  const expiredUsers = users.filter(u => u.subscription?.status === 'expired');

  const paidUsers = activeUsers.filter(u => !!u.subscription?.mpSubscriptionId);
  const manualUsers = activeUsers.filter(u => !u.subscription?.mpSubscriptionId);

  const monthlyRevenue = paidUsers.length * 24.90;
  const projectedRevenue = (paidUsers.length + Math.round(trialUsers.length * 0.3)) * 24.90;

  const handleAction = async (label: string, fn?: () => Promise<void>) => {
    if (!fn) return;
    setActionLoading(label);
    try {
      await fn();
      toast({ title: '✅ Ação realizada com sucesso' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao executar ação' });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const daysLeft = (d: string | null | undefined) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      active: 'bg-success/15 text-success',
      trial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      expired: 'bg-destructive/15 text-destructive',
    };
    const labels: Record<string, string> = { active: 'Ativo', trial: 'Trial', expired: 'Expirado' };
    return (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${styles[status] || 'bg-muted text-muted-foreground'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const planProgress = (sub: AdminUser['subscription']) => {
    if (!sub) return null;
    if (sub.status === 'active' && sub.periodStart && sub.periodEnd) {
      const start = new Date(sub.periodStart).getTime();
      const end = new Date(sub.periodEnd).getTime();
      const now = Date.now();
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const usedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, totalDays - usedDays);
      const pct = Math.min(100, Math.max(0, (usedDays / totalDays) * 100));
      return { totalDays, usedDays: Math.min(usedDays, totalDays), remaining, pct };
    }
    if (sub.status === 'trial' && sub.trialStart && sub.trialEnd) {
      const start = new Date(sub.trialStart).getTime();
      const end = new Date(sub.trialEnd).getTime();
      const now = Date.now();
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const usedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, totalDays - usedDays);
      const pct = Math.min(100, Math.max(0, (usedDays / totalDays) * 100));
      return { totalDays, usedDays: Math.min(usedDays, totalDays), remaining, pct };
    }
    return null;
  };

  const UserRow = ({ u }: { u: AdminUser }) => {
    const isExpanded = expandedUser === u.userId;
    const sub = u.subscription;
    const progress = planProgress(sub);
    const days = progress?.remaining ?? null;

    return (
      <div key={u.userId} className="border-b border-border last:border-b-0">
        <button
          onClick={() => setExpandedUser(isExpanded ? null : u.userId)}
          className="w-full grid grid-cols-[1fr_1fr_80px_24px] md:grid-cols-[1fr_1fr_100px_80px_24px] gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors text-left"
        >
          <span className="text-sm font-medium truncate text-foreground">{u.displayName || 'Sem nome'}</span>
          <span className="text-xs text-foreground/60 truncate">{u.email}</span>
          <span className="hidden md:block text-xs text-muted-foreground">
            {days !== null ? `${days}d restantes` : '—'}
          </span>
          {sub && <StatusBadge status={sub.status} />}
          {!sub && <span className="text-[10px] text-muted-foreground">—</span>}
          {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </button>

        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 space-y-3"
          >
            {/* Day progress bar */}
            {progress && (sub?.status === 'active' || sub?.status === 'trial') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    {sub?.status === 'active' ? '📅 Ciclo do Plano' : '⏳ Período de Teste'}
                  </span>
                  <span className="font-bold text-foreground">
                    {progress.usedDays}/{progress.totalDays} dias ({progress.remaining}d restantes)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden border border-border">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress.pct > 85 ? 'bg-destructive' : progress.pct > 60 ? 'bg-amber-500' : 'bg-success'
                    }`}
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>{formatDate(sub?.status === 'active' ? sub?.periodStart : sub?.trialStart)}</span>
                  <span>{formatDate(sub?.status === 'active' ? sub?.periodEnd : sub?.trialEnd)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-semibold text-foreground">{sub?.status || 'Nenhum'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Trial</p>
                <p className="font-medium text-foreground">{formatDate(sub?.trialStart)} → {formatDate(sub?.trialEnd)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Período Ativo</p>
                <p className="font-medium text-foreground">{formatDate(sub?.periodStart)} → {formatDate(sub?.periodEnd)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">MP ID</p>
                <p className="font-mono text-[10px] truncate text-foreground">{sub?.mpSubscriptionId || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email Pagador</p>
                <p className="font-medium truncate text-foreground">{sub?.mpPayerEmail || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cadastro</p>
                <p className="font-medium text-foreground">{formatDate(u.createdAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                disabled={actionLoading !== null}
                onClick={() => handleAction(`grant-${u.userId}`, () => onGrantPlan?.(u.userId, 30))}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
              >
                <Crown size={12} /> Ativar 30 dias
              </button>
              <button
                disabled={actionLoading !== null}
                onClick={() => handleAction(`trial-${u.userId}`, () => onGrantTrial?.(u.userId, 7))}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              >
                <Gift size={12} /> Trial +7 dias
              </button>
              {sub?.status === 'trial' && (
                <button
                  disabled={actionLoading !== null}
                  onClick={() => handleAction(`extend-${u.userId}`, () => onExtendTrial?.(u.userId, 7))}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  <CalendarPlus size={12} /> Estender Trial
                </button>
              )}
              {(sub?.status === 'active' || sub?.status === 'trial') && (
                <button
                  disabled={actionLoading !== null}
                  onClick={() => handleAction(`cancel-${u.userId}`, () => onRemoveSubscription?.(u.userId))}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                >
                  <Ban size={12} /> Cancelar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Revenue cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <div className="w-9 h-9 rounded-xl bg-success/10 grid place-items-center mb-2">
            <DollarSign size={18} className="text-success" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Receita Mensal</p>
          <p className="text-xl font-black text-success">R$ {monthlyRevenue.toFixed(2).replace('.', ',')}</p>
          <p className="text-[9px] text-muted-foreground">{paidUsers.length} pagante{paidUsers.length !== 1 ? 's' : ''}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <div className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center mb-2">
            <TrendingUp size={18} className="text-primary" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Projetada</p>
          <p className="text-xl font-black text-primary">R$ {projectedRevenue.toFixed(2).replace('.', ',')}</p>
          <p className="text-[9px] text-muted-foreground">30% conversão trial</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <div className="w-9 h-9 rounded-xl bg-accent/10 grid place-items-center mb-2">
            <Crown size={18} className="text-accent" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Assinantes</p>
          <p className="text-xl font-black text-foreground">{paidUsers.length}</p>
          {manualUsers.length > 0 && <p className="text-[9px] text-muted-foreground">+{manualUsers.length} manual</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 grid place-items-center mb-2">
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Em Trial</p>
          <p className="text-xl font-black text-foreground">{trialUsers.length}</p>
        </motion.div>
      </div>

      {/* Refresh */}
      {onRefresh && (
        <div className="flex justify-end">
          <button
            onClick={() => handleAction('refresh', onRefresh)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground"
          >
            <RefreshCw size={12} className={actionLoading === 'refresh' ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
      )}

      {/* Active */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Crown size={14} className="text-success" />
          <h3 className="text-sm font-semibold text-foreground">Assinantes Ativos ({activeUsers.length})</h3>
        </div>
        {activeUsers.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nenhum assinante ativo</div>}
        {activeUsers.map(u => <UserRow key={u.userId} u={u} />)}
      </div>

      {/* Trial */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Clock size={14} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">Em Período de Teste ({trialUsers.length})</h3>
        </div>
        {trialUsers.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nenhum usuário em trial</div>}
        {trialUsers.map(u => <UserRow key={u.userId} u={u} />)}
      </div>

      {/* Expired */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <XCircle size={14} className="text-destructive" />
          <h3 className="text-sm font-semibold text-destructive">Cancelados/Expirados ({expiredUsers.length})</h3>
        </div>
        {expiredUsers.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nenhum cancelamento</div>}
        {expiredUsers.map(u => <UserRow key={u.userId} u={u} />)}
      </div>
    </div>
  );
};
