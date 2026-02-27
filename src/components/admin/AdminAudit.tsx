import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, UserPlus, CreditCard, AlertTriangle,
  CheckCircle, Hourglass, Gift, Search, Shield,
  Filter, Calendar, ChevronDown, ChevronUp,
  BookOpen, StickyNote, Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AdminUser, AdminPayment, AdminReferralData, AuditLog } from '@/hooks/useAdmin';

interface Props {
  users: AdminUser[];
  payments?: AdminPayment[];
  referrals?: AdminReferralData[];
  auditLogs?: AuditLog[];
  onRefresh?: () => void;
}

type EventType = 'signup' | 'subscription_active' | 'subscription_expired' | 'trial_start' |
  'payment_approved' | 'payment_pending' | 'payment_rejected' | 'payment_cancelled' |
  'referral_created' | 'referral_converted' | 'usage';

interface AuditEvent {
  id: string;
  type: EventType;
  category: string;
  title: string;
  description: string;
  date: string;
  icon: any;
  color: string;
  details?: Record<string, string>;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  'Usuário': { label: 'Usuário', color: 'bg-primary/15 text-primary' },
  'Assinatura': { label: 'Assinatura', color: 'bg-success/15 text-success' },
  'Pagamento': { label: 'Pagamento', color: 'bg-amber-500/15 text-amber-400' },
  'Indicação': { label: 'Indicação', color: 'bg-purple-500/15 text-purple-400' },
  'Engajamento': { label: 'Engajamento', color: 'bg-cyan-500/15 text-cyan-400' },
  'Admin': { label: 'Admin', color: 'bg-red-500/15 text-red-400' },
};

export const AdminAudit = ({ users, payments = [], referrals = [], auditLogs = [], onRefresh }: Props) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);

  const events = useMemo(() => {
    const all: AuditEvent[] = [];

    // === SIGNUPS ===
    users.forEach(u => {
      all.push({
        id: `signup-${u.userId}`,
        type: 'signup',
        category: 'Usuário',
        title: 'Novo cadastro',
        description: `${u.displayName || u.email || 'Usuário'} criou uma conta`,
        date: u.createdAt,
        icon: UserPlus,
        color: 'text-primary',
        details: {
          'Nome': u.displayName || '—',
          'Email': u.email || '—',
          'Curso': u.course || '—',
          'Semestre': u.currentSemester ? `${u.currentSemester}º` : '—',
        },
      });
    });

    // === SUBSCRIPTIONS ===
    users.forEach(u => {
      const sub = u.subscription;
      if (!sub) return;

      // Trial start
      if (sub.trialStart) {
        all.push({
          id: `trial-${u.userId}`,
          type: 'trial_start',
          category: 'Assinatura',
          title: 'Trial iniciado',
          description: `${u.displayName || u.email || 'Usuário'} iniciou período de teste`,
          date: sub.trialStart,
          icon: Hourglass,
          color: 'text-amber-400',
          details: {
            'Usuário': u.displayName || '—',
            'Email': u.email || '—',
            'Início Trial': formatDateFull(sub.trialStart),
            'Fim Trial': formatDateFull(sub.trialEnd),
            'Status Atual': sub.status,
          },
        });
      }

      // Active subscription
      if (sub.status === 'active' && sub.periodStart) {
        all.push({
          id: `sub-active-${u.userId}`,
          type: 'subscription_active',
          category: 'Assinatura',
          title: 'Assinatura ativada',
          description: `${u.displayName || u.email || 'Usuário'} ativou o plano`,
          date: sub.periodStart,
          icon: CreditCard,
          color: 'text-success',
          details: {
            'Usuário': u.displayName || '—',
            'Email': u.email || '—',
            'Início': formatDateFull(sub.periodStart),
            'Fim': sub.periodEnd ? formatDateFull(sub.periodEnd) : '—',
            'Email MP': sub.mpPayerEmail || '—',
            'ID MP': sub.mpSubscriptionId || '—',
          },
        });
      }

      // Expired
      if (sub.status === 'expired') {
        all.push({
          id: `sub-expired-${u.userId}`,
          type: 'subscription_expired',
          category: 'Assinatura',
          title: 'Assinatura expirada',
          description: `Assinatura de ${u.displayName || u.email || 'Usuário'} expirou`,
          date: sub.periodEnd || sub.trialEnd,
          icon: AlertTriangle,
          color: 'text-destructive',
          details: {
            'Usuário': u.displayName || '—',
            'Email': u.email || '—',
            'Expirou em': formatDateFull(sub.periodEnd || sub.trialEnd),
          },
        });
      }
    });

    // === PAYMENTS ===
    payments.forEach(p => {
      const statusMap: Record<string, { type: EventType; title: string; icon: any; color: string }> = {
        approved: { type: 'payment_approved', title: 'Pagamento aprovado', icon: CheckCircle, color: 'text-success' },
        pending: { type: 'payment_pending', title: 'Pagamento pendente', icon: Hourglass, color: 'text-amber-400' },
        rejected: { type: 'payment_rejected', title: 'Pagamento recusado', icon: AlertTriangle, color: 'text-destructive' },
        cancelled: { type: 'payment_cancelled', title: 'Pagamento cancelado', icon: AlertTriangle, color: 'text-destructive' },
      };
      const info = statusMap[p.status] || statusMap.pending;

      all.push({
        id: `payment-${p.id}`,
        type: info.type,
        category: 'Pagamento',
        title: info.title,
        description: `${p.displayName || p.payerEmail || 'Usuário'} — R$ ${Number(p.transactionAmount).toFixed(2).replace('.', ',')}`,
        date: p.createdAt,
        icon: info.icon,
        color: info.color,
        details: {
          'Cliente': p.displayName || '—',
          'Email': p.userEmail || p.payerEmail || '—',
          'Valor': `R$ ${Number(p.transactionAmount).toFixed(2).replace('.', ',')}`,
          'Método': p.paymentMethod || '—',
          'Tipo': p.paymentType || '—',
          'Status': p.status,
          'Detalhe Status': p.statusDetail || '—',
          'MP Payment ID': p.mpPaymentId,
          'Descrição': p.description || '—',
          'Data': formatDateFull(p.createdAt),
        },
      });
    });

    // === REFERRALS ===
    referrals.forEach(r => {
      all.push({
        id: `referral-${r.id}`,
        type: 'referral_created',
        category: 'Indicação',
        title: r.status === 'converted' ? 'Indicação convertida' : 'Indicação criada',
        description: `${r.referrerName || r.referrerEmail || 'Indicador'} indicou ${r.referredName || r.referredEmail || 'usuário'}`,
        date: r.convertedAt || r.createdAt,
        icon: r.status === 'converted' ? Gift : UserPlus,
        color: r.status === 'converted' ? 'text-purple-400' : 'text-purple-300',
        details: {
          'Indicador': r.referrerName || '—',
          'Email Indicador': r.referrerEmail || '—',
          'Indicado': r.referredName || '—',
          'Email Indicado': r.referredEmail || '—',
          'Status': r.status === 'converted' ? 'Convertida' : 'Pendente',
          'Recompensa': r.rewardGranted ? 'Sim ✓' : 'Não',
          'Criada em': formatDateFull(r.createdAt),
          'Convertida em': r.convertedAt ? formatDateFull(r.convertedAt) : '—',
        },
      });
    });

    // === ENGAGEMENT (usage highlights) ===
    users.forEach(u => {
      const totalUsage = (u.subjectsCount || 0) + (u.activitiesCount || 0) + (u.notesCount || 0);
      if (totalUsage > 0) {
        all.push({
          id: `usage-${u.userId}`,
          type: 'usage',
          category: 'Engajamento',
          title: 'Atividade do usuário',
          description: `${u.displayName || u.email || 'Usuário'} — ${u.subjectsCount || 0} mat, ${u.activitiesCount || 0} ativ, ${u.notesCount || 0} notas`,
          date: u.createdAt,
          icon: Zap,
          color: 'text-cyan-400',
          details: {
            'Usuário': u.displayName || '—',
            'Matérias': String(u.subjectsCount || 0),
            'Atividades': String(u.activitiesCount || 0),
            'Anotações': String(u.notesCount || 0),
          },
        });
      }
    });

    // === ADMIN ACTIONS (from audit_logs table) ===
    const ACTION_LABELS: Record<string, string> = {
      delete_user: 'Excluiu usuário',
      grant_plan: 'Concedeu plano',
      grant_trial: 'Concedeu trial',
      extend_trial: 'Estendeu trial',
      remove_subscription: 'Removeu assinatura',
      update_subscription_status: 'Alterou status da assinatura',
    };

    auditLogs.forEach(log => {
      const detailsMap: Record<string, string> = {
        'Admin': log.adminName || log.adminUserId,
        'Alvo': log.targetName || log.targetUserId || '—',
        'Ação': ACTION_LABELS[log.action] || log.action,
        'Tabela': log.targetTable || '—',
      };
      if (log.details && typeof log.details === 'object') {
        Object.entries(log.details).forEach(([k, v]) => {
          detailsMap[k] = String(v);
        });
      }

      all.push({
        id: `audit-${log.id}`,
        type: 'signup', // reuse type
        category: 'Admin',
        title: ACTION_LABELS[log.action] || log.action,
        description: `${log.adminName || 'Admin'} → ${log.targetName || log.targetUserId || 'sistema'}`,
        date: log.createdAt,
        icon: Shield,
        color: 'text-red-400',
        details: detailsMap,
      });
    });

    // Sort by most recent
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all;
  }, [users, payments, referrals, auditLogs]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach(e => counts.set(e.category, (counts.get(e.category) || 0) + 1));
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchSearch = !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [events, categoryFilter, search]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="max-w-4xl space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {categories.map(c => {
          const style = CATEGORY_LABELS[c.name] || { label: c.name, color: 'bg-muted text-foreground/70' };
          return (
            <button
              key={c.name}
              onClick={() => setCategoryFilter(categoryFilter === c.name ? 'all' : c.name)}
              className={`rounded-xl p-3 text-left transition-all border ${
                categoryFilter === c.name
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-foreground/10 bg-foreground/5 hover:bg-foreground/10'
              }`}
            >
              <p className="text-lg font-black text-foreground">{c.count}</p>
              <p className={`text-[10px] font-bold uppercase ${style.color} rounded-full inline-block px-1.5 py-0.5 mt-1`}>
                {style.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar eventos..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-foreground/50" />
          <button
            onClick={() => setCategoryFilter('all')}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
              categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-foreground/10 text-foreground/60 hover:bg-foreground/15'
            }`}
          >
            Todos ({events.length})
          </button>
          {categories.map(c => (
            <button
              key={c.name}
              onClick={() => setCategoryFilter(categoryFilter === c.name ? 'all' : c.name)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                categoryFilter === c.name ? 'bg-primary text-primary-foreground' : 'bg-foreground/10 text-foreground/60 hover:bg-foreground/15'
              }`}
            >
              {c.name} ({c.count})
            </button>
          ))}
        </div>
      </div>

      {/* Event count */}
      <div className="flex items-center gap-2 text-foreground/50">
        <ClipboardList size={14} />
        <span className="text-xs">{filtered.length} evento(s) encontrado(s)</span>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-foreground/10 bg-card overflow-hidden">
        {visible.length === 0 && (
          <div className="p-8 text-center text-sm text-foreground/50">Nenhum evento encontrado</div>
        )}
        <div className="divide-y divide-foreground/5">
          {visible.map((event, i) => {
            const isExpanded = expandedEvent === event.id;
            const catStyle = CATEGORY_LABELS[event.category] || { label: event.category, color: 'bg-muted text-foreground/60' };

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.01, 0.3) }}
              >
                <button
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-foreground/5 grid place-items-center shrink-0">
                    <event.icon size={14} className={event.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${catStyle.color}`}>
                        {catStyle.label}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60 truncate">{event.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-foreground/50">
                      {new Date(event.date).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-[9px] text-foreground/40">
                      {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {event.details && (
                    <div className="shrink-0">
                      {isExpanded ? <ChevronUp size={14} className="text-foreground/40" /> : <ChevronDown size={14} className="text-foreground/40" />}
                    </div>
                  )}
                </button>

                {/* Expanded details */}
                {isExpanded && event.details && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-[60px]">
                      <div className="rounded-lg bg-foreground/5 border border-foreground/10 p-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(event.details).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-[10px] text-foreground/50 uppercase font-medium">{key}</p>
                            <p className="text-xs font-medium text-foreground truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Load more */}
        {visibleCount < filtered.length && (
          <div className="p-3 border-t border-foreground/5 text-center">
            <button
              onClick={() => setVisibleCount(v => v + 50)}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Carregar mais ({filtered.length - visibleCount} restantes)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function formatDateFull(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
