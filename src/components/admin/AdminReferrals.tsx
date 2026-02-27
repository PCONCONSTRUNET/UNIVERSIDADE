import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Users, Trophy, TrendingUp, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface AdminReferral {
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

interface Props {
  referrals: AdminReferral[];
  onRefresh: () => void;
}

export const AdminReferrals = ({ referrals, onRefresh }: Props) => {
  const [search, setSearch] = useState('');
  const [expandedReferrer, setExpandedReferrer] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = referrals.length;
    const converted = referrals.filter(r => r.status === 'converted').length;
    const pending = referrals.filter(r => r.status === 'pending').length;
    const rewarded = referrals.filter(r => r.rewardGranted).length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    // Group by referrer
    const byReferrer = new Map<string, AdminReferral[]>();
    referrals.forEach(r => {
      const list = byReferrer.get(r.referrerId) || [];
      list.push(r);
      byReferrer.set(r.referrerId, list);
    });

    // Top referrers sorted by converted count
    const topReferrers = Array.from(byReferrer.entries())
      .map(([id, refs]) => ({
        id,
        name: refs[0].referrerName || refs[0].referrerEmail || id.slice(0, 8),
        email: refs[0].referrerEmail,
        total: refs.length,
        converted: refs.filter(r => r.status === 'converted').length,
        pending: refs.filter(r => r.status === 'pending').length,
        rewarded: refs.filter(r => r.rewardGranted).length,
        refs,
      }))
      .sort((a, b) => b.converted - a.converted);

    return { total, converted, pending, rewarded, conversionRate, topReferrers };
  }, [referrals]);

  const filtered = useMemo(() => {
    if (!search) return stats.topReferrers;
    const s = search.toLowerCase();
    return stats.topReferrers.filter(r =>
      r.name?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s)
    );
  }, [stats.topReferrers, search]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Gift} label="Total Indicações" value={stats.total} color="text-primary" bg="bg-primary/10" delay={0} />
        <KpiCard icon={Users} label="Convertidas" value={stats.converted} color="text-success" bg="bg-success/10" delay={0.05} sub={`${stats.conversionRate.toFixed(1)}% taxa`} />
        <KpiCard icon={TrendingUp} label="Pendentes" value={stats.pending} color="text-amber-500" bg="bg-amber-500/10" delay={0.1} />
        <KpiCard icon={Trophy} label="Recompensas" value={stats.rewarded} color="text-primary" bg="bg-primary/10" delay={0.15} sub="indicações premiadas" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email do indicador..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Referrers list */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Ranking de Indicadores ({filtered.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma indicação encontrada</div>
          )}
          {filtered.map((referrer, i) => {
            const isExpanded = expandedReferrer === referrer.id;
            const monthsEarned = referrer.converted >= 30
              ? 6 + Math.floor((referrer.converted - 30) / 5)
              : Math.floor(referrer.converted / 5);

            return (
              <div key={referrer.id}>
                <button
                  onClick={() => setExpandedReferrer(isExpanded ? null : referrer.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 grid place-items-center shrink-0">
                    <span className="text-xs font-bold text-primary">#{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{referrer.name}</p>
                    <p className="text-[10px] text-foreground/60 truncate">{referrer.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{referrer.converted} conv.</Badge>
                    {referrer.pending > 0 && <Badge variant="outline" className="text-[10px]">{referrer.pending} pend.</Badge>}
                    {monthsEarned > 0 && (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">+{monthsEarned} mês</Badge>
                    )}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-muted/20 px-4 pb-4"
                  >
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>Progresso: {referrer.converted % 5}/5 para próximo mês</span>
                      </div>
                      <Progress value={(referrer.converted % 5) / 5 * 100} className="h-1.5 [&>div]:bg-primary" />
                    </div>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Indicado</th>
                            <th className="text-left p-2 font-medium">Status</th>
                            <th className="text-left p-2 font-medium">Data</th>
                            <th className="text-left p-2 font-medium">Premiado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {referrer.refs.map(ref => (
                            <tr key={ref.id}>
                              <td className="p-2 text-foreground">{ref.referredName || ref.referredEmail || ref.referredId.slice(0, 8)}</td>
                              <td className="p-2">
                                <Badge variant={ref.status === 'converted' ? 'default' : 'outline'} className="text-[9px]">
                                  {ref.status === 'converted' ? 'Convertida' : 'Pendente'}
                                </Badge>
                              </td>
                              <td className="p-2 text-muted-foreground">
                                {new Date(ref.createdAt).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="p-2">
                                {ref.rewardGranted ? <span className="text-success">✓</span> : <span className="text-muted-foreground">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
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
