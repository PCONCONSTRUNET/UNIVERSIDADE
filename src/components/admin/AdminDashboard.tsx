import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Clock, CreditCard, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Crown,
  DollarSign, UserPlus, BarChart3, Activity,
  BookOpen, FileText, Zap,
} from 'lucide-react';
import { AdminMetrics, AdminUser, AdminPayment } from '@/hooks/useAdmin';

interface Props {
  metrics: AdminMetrics | null;
  users: AdminUser[];
  payments?: AdminPayment[];
}

export const AdminDashboard = ({ metrics, users, payments = [] }: Props) => {
  const stats = useMemo(() => {
    if (!metrics) return null;

    const approvedPayments = payments.filter(p => p.status === 'approved');
    const totalPaymentsRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.transactionAmount), 0);

    // Calculate actual monthly revenue from real payments (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentPayments = approvedPayments.filter(p => new Date(p.createdAt) >= thirtyDaysAgo);
    const monthlyRevenue = recentPayments.reduce((sum, p) => sum + Number(p.transactionAmount), 0);

    const conversionRate = metrics.totalUsers > 0
      ? ((metrics.activeSubscriptions / metrics.totalUsers) * 100)
      : 0;
    const churnRate = metrics.totalUsers > 0
      ? ((metrics.expiredSubscriptions / metrics.totalUsers) * 100)
      : 0;
    const growthDiff = metrics.newUsersThisWeek - metrics.newUsersLastWeek;
    const growthPercent = metrics.newUsersLastWeek > 0
      ? ((growthDiff / metrics.newUsersLastWeek) * 100)
      : 0;

    const totalSubjects = users.reduce((sum, u) => sum + (u.subjectsCount || 0), 0);
    const totalActivities = users.reduce((sum, u) => sum + (u.activitiesCount || 0), 0);
    const totalNotes = users.reduce((sum, u) => sum + (u.notesCount || 0), 0);

    // Already computed above: approvedPayments, totalPaymentsRevenue

    // Users by status for donut-like display
    const statusBreakdown = [
      { label: 'Ativos', count: metrics.activeSubscriptions, color: 'bg-success' },
      { label: 'Trial', count: metrics.activeTrials, color: 'bg-amber-500' },
      { label: 'Expirados', count: metrics.expiredSubscriptions, color: 'bg-destructive' },
      { label: 'Sem plano', count: metrics.totalUsers - metrics.activeSubscriptions - metrics.activeTrials - metrics.expiredSubscriptions, color: 'bg-muted-foreground/30' },
    ];

    return {
      monthlyRevenue, conversionRate, churnRate,
      growthDiff, growthPercent, totalSubjects, totalActivities, totalNotes,
      totalPaymentsRevenue, approvedPayments, statusBreakdown,
    };
  }, [metrics, users, payments]);

  if (!metrics || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando métricas...</div>
      </div>
    );
  }

  const totalBar = Math.max(metrics.totalUsers, 1);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Users} label="Total Usuários" value={metrics.totalUsers}
          color="text-primary" bg="bg-primary/10" delay={0}
        />
        <KpiCard
          icon={DollarSign} label="Receita Mensal" value={`R$ ${stats.monthlyRevenue.toFixed(2).replace('.', ',')}`}
          color="text-success" bg="bg-success/10" delay={0.05}
          sub={`últimos 30 dias`}
        />
        <KpiCard
          icon={Crown} label="Assinantes" value={metrics.activeSubscriptions}
          color="text-success" bg="bg-success/10" delay={0.1}
          sub={`${stats.conversionRate.toFixed(1)}% conversão`}
        />
        <KpiCard
          icon={Clock} label="Em Trial" value={metrics.activeTrials}
          color="text-amber-500" bg="bg-amber-500/10" delay={0.15}
        />
      </div>

      {/* Growth + Conversion + Churn row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center">
              <UserPlus size={16} className="text-primary" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Crescimento Semanal</p>
          </div>
          <p className="text-3xl font-black text-foreground">{metrics.newUsersThisWeek}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {stats.growthDiff > 0 ? <TrendingUp size={14} className="text-success" /> :
             stats.growthDiff < 0 ? <TrendingDown size={14} className="text-destructive" /> :
             <Minus size={14} className="text-muted-foreground" />}
            <span className={`text-xs font-semibold ${stats.growthDiff > 0 ? 'text-success' : stats.growthDiff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {stats.growthDiff >= 0 ? '+' : ''}{stats.growthDiff}
            </span>
            <span className="text-xs text-muted-foreground">vs semana anterior</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 grid place-items-center">
              <BarChart3 size={16} className="text-success" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Taxa de Conversão</p>
          </div>
          <p className="text-3xl font-black text-success">{stats.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">usuários → assinantes</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 grid place-items-center">
              <AlertTriangle size={16} className="text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Taxa de Churn</p>
          </div>
          <p className="text-3xl font-black text-destructive">{stats.churnRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">{metrics.expiredSubscriptions} expirado{metrics.expiredSubscriptions !== 1 ? 's' : ''}</p>
        </motion.div>
      </div>

      {/* Status breakdown bar + Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Status bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Distribuição de Usuários</h3>
          {/* Visual bar */}
          <div className="flex rounded-full overflow-hidden h-4 mb-4">
            {stats.statusBreakdown.map((s, i) => (
              s.count > 0 && (
                <div
                  key={i}
                  className={`${s.color} transition-all duration-500`}
                  style={{ width: `${(s.count / totalBar) * 100}%` }}
                />
              )
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {stats.statusBreakdown.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className="text-xs font-bold ml-auto text-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Platform engagement */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Engajamento da Plataforma</h3>
          <div className="space-y-3">
            <EngagementRow icon={BookOpen} label="Matérias cadastradas" value={stats.totalSubjects} color="text-primary" />
            <EngagementRow icon={Zap} label="Atividades criadas" value={stats.totalActivities} color="text-amber-500" />
            <EngagementRow icon={FileText} label="Anotações feitas" value={stats.totalNotes} color="text-success" />
            <EngagementRow icon={CreditCard} label="Pagamentos aprovados" value={stats.approvedPayments.length} color="text-primary" />
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Receita total processada</span>
              <span className="text-sm font-bold text-success">R$ {stats.totalPaymentsRevenue.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent users */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="rounded-2xl bg-card p-5 shadow-sm border border-border">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Últimos Cadastros</h3>
        <div className="divide-y divide-border">
          {users.slice(0, 8).map(u => {
            const status = u.subscription?.status;
            const statusColor = status === 'active' ? 'bg-success' : status === 'trial' ? 'bg-amber-500' : status === 'expired' ? 'bg-destructive' : 'bg-muted-foreground/30';
            return (
              <div key={u.userId} className="flex items-center gap-3 py-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 grid place-items-center shrink-0 relative">
                  <span className="text-xs font-bold text-primary">
                    {(u.displayName || u.email || '?')[0].toUpperCase()}
                  </span>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${statusColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{u.displayName || 'Sem nome'}</p>
                  <p className="text-[10px] text-foreground/60 truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {u.subjectsCount || 0} mat · {u.activitiesCount || 0} ativ
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, color, bg, delay = 0, sub }: {
  icon: any; label: string; value: number | string; color: string; bg: string; delay?: number; sub?: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="rounded-2xl bg-card p-4 shadow-sm border border-border">
    <div className={`w-9 h-9 rounded-xl ${bg} grid place-items-center mb-2`}>
      <Icon size={18} className={color} />
    </div>
    <p className="text-2xl font-black text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</p>
    {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
  </motion.div>
);

const EngagementRow = ({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: number; color: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-muted/50 grid place-items-center shrink-0">
      <Icon size={14} className={color} />
    </div>
    <span className="text-xs text-muted-foreground flex-1">{label}</span>
    <span className="text-sm font-bold text-foreground">{value}</span>
  </div>
);
