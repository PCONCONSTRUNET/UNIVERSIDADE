import { AdminPayment } from '@/hooks/useAdmin';
import { Receipt, CheckCircle, AlertCircle, Hourglass, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  payments?: AdminPayment[];
  onRefresh?: () => Promise<void>;
}

export const AdminPayments = ({ payments = [], onRefresh }: Props) => {
  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const approvedCount = payments.filter(p => p.status === 'approved').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const totalRevenue = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + Number(p.transactionAmount), 0);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total Recebido</p>
          <p className="text-xl font-black text-success">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
          <p className="text-[9px] text-muted-foreground">{approvedCount} pagamento{approvedCount !== 1 ? 's' : ''} aprovado{approvedCount !== 1 ? 's' : ''}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Pendentes</p>
          <p className="text-xl font-black text-amber-500">{pendingCount}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-card p-4 shadow-sm border border-border">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total Transações</p>
          <p className="text-xl font-black text-foreground">{payments.length}</p>
        </motion.div>
      </div>

      {/* Refresh */}
      {onRefresh && (
        <div className="flex justify-end">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground"
          >
            <RefreshCw size={12} /> Atualizar
          </button>
        </div>
      )}

      {/* Payments list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Receipt size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Histórico de Pagamentos ({payments.length})</h3>
        </div>
        {payments.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Nenhum pagamento registrado</div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map(p => {
              const statusIcon = p.status === 'approved' ? <CheckCircle size={14} className="text-success" /> :
                p.status === 'pending' ? <Hourglass size={14} className="text-amber-500" /> :
                <AlertCircle size={14} className="text-destructive" />;
              const statusLabel = p.status === 'approved' ? 'Aprovado' :
                p.status === 'pending' ? 'Pendente' :
                p.status === 'rejected' ? 'Recusado' :
                p.status === 'cancelled' ? 'Cancelado' : p.status;
              const statusColor = p.status === 'approved' ? 'text-success' :
                p.status === 'pending' ? 'text-amber-500' : 'text-destructive';

              return (
                <div key={p.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_100px_150px] gap-2 items-center">
                  <div>
                    <p className="text-sm font-medium truncate text-foreground">{p.displayName || 'Sem nome'}</p>
                    <p className="text-[10px] text-foreground/60 truncate">{p.userEmail || p.payerEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MP #{p.mpPaymentId}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{p.paymentMethod || '—'} • {p.paymentType || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {statusIcon}
                    <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">R$ {Number(p.transactionAmount).toFixed(2).replace('.', ',')}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
