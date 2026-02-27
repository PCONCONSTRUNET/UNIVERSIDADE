import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, Filter, Download,
  CheckCircle, AlertCircle, Hourglass, X, ChevronDown,
  ChevronUp, Calendar, FileText, Table2, RefreshCw,
  ArrowUpRight, ArrowDownRight, BarChart3,
} from 'lucide-react';
import { AdminPayment } from '@/hooks/useAdmin';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import jsPDF from 'jspdf';

type FilterPeriod = 'today' | 'week' | 'month' | 'custom';

interface Props {
  payments?: AdminPayment[];
  onRefresh?: () => Promise<void>;
}

const COLORS = ['hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(215, 20%, 65%)'];

export const AdminFinanceiro = ({ payments = [], onRefresh }: Props) => {
  const [period, setPeriod] = useState<FilterPeriod>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter by period
  const filteredPayments = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end = new Date(now);

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        start = customStart ? new Date(customStart) : new Date(0);
        end = customEnd ? new Date(customEnd + 'T23:59:59') : new Date();
        break;
      default:
        start = new Date(0);
    }

    return payments
      .filter(p => {
        const d = new Date(p.createdAt);
        return d >= start && d <= end;
      })
      .filter(p => statusFilter === 'all' || p.status === statusFilter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [payments, period, customStart, customEnd, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const approved = filteredPayments.filter(p => p.status === 'approved');
    const pending = filteredPayments.filter(p => p.status === 'pending');
    const rejected = filteredPayments.filter(p => p.status === 'rejected' || p.status === 'cancelled');
    const totalRevenue = approved.reduce((sum, p) => sum + Number(p.transactionAmount), 0);
    const pendingRevenue = pending.reduce((sum, p) => sum + Number(p.transactionAmount), 0);
    const avgTicket = approved.length > 0 ? totalRevenue / approved.length : 0;
    return { approved, pending, rejected, totalRevenue, pendingRevenue, avgTicket, total: filteredPayments.length };
  }, [filteredPayments]);

  // Chart data — adapts grouping to filter period
  const chartData = useMemo(() => {
    const groupMap = new Map<string, { date: string; receita: number; pendente: number; recusado: number; count: number }>();

    const getKey = (dateStr: string) => {
      const d = new Date(dateStr);
      if (period === 'today') {
        return `${String(d.getHours()).padStart(2, '0')}:00`;
      }
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    filteredPayments.forEach(p => {
      const key = getKey(p.createdAt);
      const existing = groupMap.get(key) || { date: key, receita: 0, pendente: 0, recusado: 0, count: 0 };
      const amount = Number(p.transactionAmount);
      if (p.status === 'approved') existing.receita += amount;
      else if (p.status === 'pending') existing.pendente += amount;
      else existing.recusado += amount;
      existing.count += 1;
      groupMap.set(key, existing);
    });

    // Sort chronologically
    const entries = Array.from(groupMap.values());
    if (period === 'today') {
      entries.sort((a, b) => a.date.localeCompare(b.date));
    } else {
      entries.sort((a, b) => {
        const [da, ma] = a.date.split('/').map(Number);
        const [db, mb] = b.date.split('/').map(Number);
        return ma !== mb ? ma - mb : da - db;
      });
    }
    return entries;
  }, [filteredPayments, period]);

  // Pie data
  const pieData = useMemo(() => [
    { name: 'Aprovados', value: metrics.approved.length },
    { name: 'Pendentes', value: metrics.pending.length },
    { name: 'Recusados', value: metrics.rejected.length },
  ].filter(d => d.value > 0), [metrics]);

  // Payment method breakdown
  const methodData = useMemo(() => {
    const map = new Map<string, number>();
    filteredPayments.filter(p => p.status === 'approved').forEach(p => {
      const method = p.paymentMethod || 'Outros';
      map.set(method, (map.get(method) || 0) + Number(p.transactionAmount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name: name === 'pix' ? 'PIX' : name === 'credit_card' ? 'Cartão' : name, value }));
  }, [filteredPayments]);

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Export PDF
  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório Financeiro - Study Hakify', 14, 20);
    doc.setFontSize(10);
    doc.text(`Período: ${period === 'today' ? 'Hoje' : period === 'week' ? 'Última semana' : period === 'month' ? 'Este mês' : `${customStart} a ${customEnd}`}`, 14, 28);
    doc.text(`Total: ${metrics.total} transações | Receita: ${formatCurrency(metrics.totalRevenue)}`, 14, 35);

    let y = 45;
    doc.setFontSize(8);
    doc.text('Data', 14, y);
    doc.text('Cliente', 50, y);
    doc.text('Método', 110, y);
    doc.text('Status', 140, y);
    doc.text('Valor', 170, y);
    y += 6;

    filteredPayments.forEach(p => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(formatDate(p.createdAt).substring(0, 16), 14, y);
      doc.text((p.displayName || p.payerEmail || '—').substring(0, 25), 50, y);
      doc.text(p.paymentMethod || '—', 110, y);
      doc.text(p.status, 140, y);
      doc.text(formatCurrency(Number(p.transactionAmount)), 170, y);
      y += 5;
    });

    doc.save('financeiro-hakify.pdf');
  }, [filteredPayments, metrics, period, customStart, customEnd]);

  // Export CSV (Excel-compatible)
  const exportCSV = useCallback(() => {
    const headers = ['Data,Cliente,Email,MP ID,Método,Tipo,Status,Detalhe,Valor'];
    const rows = filteredPayments.map(p =>
      `${formatDate(p.createdAt)},"${p.displayName || ''}","${p.userEmail || p.payerEmail || ''}",${p.mpPaymentId},${p.paymentMethod || ''},${p.paymentType || ''},${p.status},${p.statusDetail || ''},${Number(p.transactionAmount).toFixed(2)}`
    );
    const csv = '\uFEFF' + headers.concat(rows).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financeiro-hakify.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredPayments]);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'approved') return <CheckCircle size={14} className="text-success" />;
    if (status === 'pending') return <Hourglass size={14} className="text-amber-500" />;
    return <AlertCircle size={14} className="text-destructive" />;
  };

  const statusLabel = (s: string) =>
    s === 'approved' ? 'Aprovado' : s === 'pending' ? 'Pendente' : s === 'rejected' ? 'Recusado' : s === 'cancelled' ? 'Cancelado' : s;

  const statusColor = (s: string) =>
    s === 'approved' ? 'text-success' : s === 'pending' ? 'text-amber-500' : 'text-destructive';

  return (
    <div className="max-w-6xl space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} label="Receita" value={formatCurrency(metrics.totalRevenue)} color="text-success" bg="bg-success/10" sub={`${metrics.approved.length} aprovados`} />
        <KpiCard icon={Hourglass} label="Pendente" value={formatCurrency(metrics.pendingRevenue)} color="text-amber-500" bg="bg-amber-500/10" sub={`${metrics.pending.length} aguardando`} />
        <KpiCard icon={BarChart3} label="Ticket Médio" value={formatCurrency(metrics.avgTicket)} color="text-primary" bg="bg-primary/10" />
        <KpiCard icon={AlertCircle} label="Recusados" value={String(metrics.rejected.length)} color="text-destructive" bg="bg-destructive/10" sub={`de ${metrics.total} total`} />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground mr-1">Período:</span>
          {(['today', 'week', 'month', 'custom'] as FilterPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === 'week' ? 'Semanal' : p === 'month' ? 'Mensal' : 'Personalizado'}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg bg-muted border-0 px-2 py-1.5 text-foreground"
            >
              <option value="all">Todos</option>
              <option value="approved">Aprovados</option>
              <option value="pending">Pendentes</option>
              <option value="rejected">Recusados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            <Calendar size={14} className="text-muted-foreground" />
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="text-xs rounded-lg bg-muted border-0 px-3 py-1.5 text-foreground"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="text-xs rounded-lg bg-muted border-0 px-3 py-1.5 text-foreground"
            />
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Revenue area chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 text-foreground">
            Receita {period === 'today' ? '— Hoje (por hora)' : period === 'week' ? '— Semanal (por dia)' : period === 'month' ? '— Mensal (por dia)' : '— Personalizado'}
          </h3>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Sem dados no período</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPendente" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="receita" stroke="hsl(142, 71%, 45%)" fill="url(#gradReceita)" strokeWidth={2} name="Receita" />
                <Area type="monotone" dataKey="pendente" stroke="hsl(38, 92%, 50%)" fill="url(#gradPendente)" strokeWidth={2} name="Pendente" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Status pie + Method bar */}
        <div className="space-y-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-2 text-foreground">Status</h3>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={50} innerRadius={30} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => v} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-2 text-foreground">Métodos de Pagamento</h3>
            {methodData.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={methodData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `R$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={50} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>
      </div>

      {/* Export + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
            <FileText size={12} /> Exportar PDF
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors">
            <Table2 size={12} /> Exportar Excel
          </button>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground">
            <RefreshCw size={12} /> Atualizar
          </button>
        )}
      </div>

      {/* Payments list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Transações ({filteredPayments.length})</h3>
          <span className="text-[10px] text-muted-foreground">Clique para ver detalhes</span>
        </div>
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma transação encontrada neste período</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredPayments.map(p => {
              const isExpanded = expandedPayment === p.id;
              return (
                <div key={p.id}>
                  <button
                    onClick={() => setExpandedPayment(isExpanded ? null : p.id)}
                    className="w-full px-4 py-3 grid grid-cols-[1fr_90px_90px_24px] md:grid-cols-[1fr_1fr_90px_100px_130px_24px] gap-2 items-center hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{p.displayName || 'Sem nome'}</p>
                      <p className="text-[10px] text-muted-foreground truncate md:hidden">{p.paymentMethod || '—'}</p>
                    </div>
                    <div className="hidden md:block min-w-0">
                      <p className="text-xs text-foreground/60 truncate">{p.userEmail || p.payerEmail}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusIcon status={p.status} />
                      <span className={`text-[11px] font-semibold ${statusColor(p.status)}`}>{statusLabel(p.status)}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(Number(p.transactionAmount))}</p>
                    <p className="hidden md:block text-[11px] text-muted-foreground">{formatDate(p.createdAt)}</p>
                    {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-muted/20">
                          <Detail label="MP Payment ID" value={p.mpPaymentId} mono />
                          <Detail label="Status Detalhe" value={p.statusDetail || '—'} />
                          <Detail label="Método" value={p.paymentMethod || '—'} />
                          <Detail label="Tipo" value={p.paymentType || '—'} />
                          <Detail label="Email Pagador" value={p.payerEmail || '—'} />
                          <Detail label="Email Usuário" value={p.userEmail || '—'} />
                          <Detail label="Descrição" value={p.description || '—'} />
                          <Detail label="Data Completa" value={formatDate(p.createdAt)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, color, bg, sub }: {
  icon: any; label: string; value: string; color: string; bg: string; sub?: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl bg-card p-4 shadow-sm border border-border">
    <div className={`w-9 h-9 rounded-xl ${bg} grid place-items-center mb-2`}>
      <Icon size={18} className={color} />
    </div>
    <p className="text-xl font-black text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</p>
    {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
  </motion.div>
);

const Detail = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <p className="text-muted-foreground text-[10px]">{label}</p>
    <p className={`font-medium text-xs truncate text-foreground ${mono ? 'font-mono text-[10px]' : ''}`}>{value}</p>
  </div>
);
