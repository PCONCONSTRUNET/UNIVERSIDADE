import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, UserCheck, UserX, RefreshCw, BookOpen,
  ClipboardList, StickyNote, Calendar, CreditCard, Mail, GraduationCap,
  Plus, Trash2, Gift, Clock, Download, FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AdminUser } from '@/hooks/useAdmin';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  trial: { label: 'Trial', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  active: { label: 'Ativo', color: 'text-success', bg: 'bg-success/10' },
  expired: { label: 'Expirado', color: 'text-destructive', bg: 'bg-destructive/10' },
};

interface Props {
  adminData: {
    users: AdminUser[];
    updateSubscriptionStatus: (userId: string, status: string) => Promise<void>;
    extendTrial: (userId: string, days: number) => Promise<void>;
    removeSubscription: (userId: string) => Promise<void>;
    grantPlan: (userId: string, durationDays: number) => Promise<void>;
    grantTrial: (userId: string, days: number) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
  };
}

export const AdminClients = ({ adminData }: Props) => {
  const { users, updateSubscriptionStatus, extendTrial, removeSubscription, grantPlan, grantTrial, deleteUser } = adminData;
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.course?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.subscription?.status === statusFilter || (!u.subscription && statusFilter === 'none');
    return matchSearch && matchStatus;
  });

  const handleAction = async (action: () => Promise<void>, successMsg: string) => {
    await action();
    toast({ title: '✅ Sucesso!', description: successMsg });
  };

  const getStatusLabel = (u: AdminUser) => {
    if (!u.subscription) return 'Sem plano';
    return STATUS_LABELS[u.subscription.status]?.label || u.subscription.status;
  };

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Curso', 'Semestre', 'Cadastro', 'Status', 'Fim Trial', 'Fim Plano', 'Matérias', 'Atividades', 'Anotações'];
    const rows = filteredUsers.map(u => [
      u.displayName || '',
      u.email || '',
      u.course || '',
      u.currentSemester?.toString() || '',
      new Date(u.createdAt).toLocaleDateString('pt-BR'),
      getStatusLabel(u),
      u.subscription?.trialEnd ? new Date(u.subscription.trialEnd).toLocaleDateString('pt-BR') : '',
      u.subscription?.periodEnd ? new Date(u.subscription.periodEnd).toLocaleDateString('pt-BR') : '',
      (u.subjectsCount || 0).toString(),
      (u.activitiesCount || 0).toString(),
      (u.notesCount || 0).toString(),
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-studyhakify-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: '✅ CSV exportado!', description: `${filteredUsers.length} clientes exportados.` });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleDateString('pt-BR');

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Study Hakify - Relatório de Clientes', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${now} | Total: ${filteredUsers.length} clientes`, 14, 28);

    // Summary
    const active = filteredUsers.filter(u => u.subscription?.status === 'active').length;
    const trial = filteredUsers.filter(u => u.subscription?.status === 'trial').length;
    const expired = filteredUsers.filter(u => u.subscription?.status === 'expired').length;
    const noSub = filteredUsers.filter(u => !u.subscription).length;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo', 14, 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Ativos: ${active} | Trial: ${trial} | Expirados: ${expired} | Sem plano: ${noSub}`, 14, 44);
    doc.text(`Receita estimada: R$ ${(active * 24.90).toFixed(2).replace('.', ',')} /mês`, 14, 50);

    // Table header
    let y = 60;
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y - 4, 182, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Nome', 16, y);
    doc.text('Email', 55, y);
    doc.text('Curso', 105, y);
    doc.text('Status', 140, y);
    doc.text('Cadastro', 165, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    filteredUsers.forEach(u => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text((u.displayName || 'Sem nome').substring(0, 20), 16, y);
      doc.text((u.email || '').substring(0, 25), 55, y);
      doc.text((u.course || '—').substring(0, 16), 105, y);
      doc.text(getStatusLabel(u), 140, y);
      doc.text(new Date(u.createdAt).toLocaleDateString('pt-BR'), 165, y);
      y += 5;
    });

    doc.save(`clientes-studyhakify-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: '✅ PDF exportado!', description: `${filteredUsers.length} clientes exportados.` });
  };

  return (
    <div className="max-w-5xl space-y-4">
      {/* Filters & Export */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, email ou curso..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 border-foreground/20 text-foreground bg-foreground/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({users.length})</SelectItem>
            <SelectItem value="trial">Trial ({users.filter(u => u.subscription?.status === 'trial').length})</SelectItem>
            <SelectItem value="active">Ativo ({users.filter(u => u.subscription?.status === 'active').length})</SelectItem>
            <SelectItem value="expired">Expirado ({users.filter(u => u.subscription?.status === 'expired').length})</SelectItem>
            <SelectItem value="none">Sem sub ({users.filter(u => !u.subscription).length})</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={exportCSV} className="border-foreground/20 text-foreground/80 hover:text-foreground hover:bg-foreground/10">
            <Download size={14} className="mr-1.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={exportPDF} className="border-foreground/20 text-foreground/80 hover:text-foreground hover:bg-foreground/10">
            <FileText size={14} className="mr-1.5" /> PDF
          </Button>
        </div>
      </div>

      <p className="text-xs text-foreground/50">{filteredUsers.length} resultado(s)</p>

      {/* Client cards */}
      <div className="space-y-2">
        {filteredUsers.map(u => {
          const sub = u.subscription;
          const statusInfo = sub ? (STATUS_LABELS[sub.status] || { label: sub.status, color: 'text-muted-foreground', bg: 'bg-muted' }) : null;
          const isExpanded = expandedUser === u.userId;
          const daysLeft = sub?.trialEnd && sub.status === 'trial'
            ? Math.ceil((new Date(sub.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;
          const activeDaysLeft = sub?.periodEnd && sub.status === 'active'
            ? Math.ceil((new Date(sub.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <div key={u.userId} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => setExpandedUser(isExpanded ? null : u.userId)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {(u.displayName || u.email || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{u.displayName || 'Sem nome'}</p>
                  <p className="text-xs text-foreground/70 truncate">{u.email}</p>
                </div>
                <div className="hidden md:flex items-center gap-3 text-xs text-foreground/50">
                  <span className="flex items-center gap-1"><BookOpen size={12} /> {u.subjectsCount}</span>
                  <span className="flex items-center gap-1"><ClipboardList size={12} /> {u.activitiesCount}</span>
                  <span className="flex items-center gap-1"><StickyNote size={12} /> {u.notesCount}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {statusInfo ? (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                      {daysLeft !== null && ` (${daysLeft}d)`}
                      {activeDaysLeft !== null && ` (${activeDaysLeft}d)`}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Sem plano</span>
                  )}
                  <ChevronDown size={14} className={`text-foreground/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border bg-secondary/5 px-5 py-4 space-y-5">
                      {/* User info grid */}
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">Informações do Usuário</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <InfoItem icon={Mail} label="Email" value={u.email || '—'} />
                          <InfoItem icon={GraduationCap} label="Curso" value={u.course || '—'} />
                          <InfoItem icon={BookOpen} label="Semestre" value={u.currentSemester ? `${u.currentSemester}º` : '—'} />
                          <InfoItem icon={Calendar} label="Cadastro" value={new Date(u.createdAt).toLocaleDateString('pt-BR')} />
                        </div>
                      </div>

                      {/* Usage stats */}
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">Uso do App</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <StatCard icon={BookOpen} label="Matérias" value={u.subjectsCount || 0} />
                          <StatCard icon={ClipboardList} label="Atividades" value={u.activitiesCount || 0} />
                          <StatCard icon={StickyNote} label="Anotações" value={u.notesCount || 0} />
                        </div>
                      </div>

                      {/* Subscription details */}
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">Assinatura</h4>
                        {sub ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <InfoItem icon={CreditCard} label="Status" value={STATUS_LABELS[sub.status]?.label || sub.status} />
                            <InfoItem icon={Clock} label="Início Trial" value={new Date(sub.trialStart).toLocaleDateString('pt-BR')} />
                            <InfoItem icon={Clock} label="Fim Trial" value={new Date(sub.trialEnd).toLocaleDateString('pt-BR')} />
                            <InfoItem icon={Calendar} label="Fim Plano" value={sub.periodEnd ? new Date(sub.periodEnd).toLocaleDateString('pt-BR') : '—'} />
                            {sub.mpPayerEmail && <InfoItem icon={Mail} label="Email MP" value={sub.mpPayerEmail} />}
                            {sub.mpSubscriptionId && <InfoItem icon={CreditCard} label="ID MP" value={sub.mpSubscriptionId} />}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground mb-4">Nenhuma assinatura encontrada</p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {/* Grant plan */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Plus size={12} className="mr-1.5" /> Adicionar Plano
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adicionar plano para {u.displayName || u.email}</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-3 py-4">
                                {[
                                  { label: '30 dias', days: 30 },
                                  { label: '90 dias', days: 90 },
                                  { label: '180 dias', days: 180 },
                                  { label: '1 ano', days: 365 },
                                ].map(opt => (
                                  <DialogClose key={opt.days} asChild>
                                    <Button
                                      variant="outline"
                                      className="h-16 flex-col"
                                      onClick={() => handleAction(
                                        () => grantPlan(u.userId, opt.days),
                                        `Plano de ${opt.label} ativado!`
                                      )}
                                    >
                                      <span className="text-lg font-bold">{opt.label}</span>
                                      <span className="text-[10px] text-muted-foreground">R$ 24,90/mês</span>
                                    </Button>
                                  </DialogClose>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Grant trial */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Gift size={12} className="mr-1.5" /> Dar Trial
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Dar trial para {u.displayName || u.email}</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-3 gap-3 py-4">
                                {[7, 14, 30].map(days => (
                                  <DialogClose key={days} asChild>
                                    <Button
                                      variant="outline"
                                      className="h-14 flex-col"
                                      onClick={() => handleAction(
                                        () => grantTrial(u.userId, days),
                                        `Trial de ${days} dias ativado!`
                                      )}
                                    >
                                      <span className="text-lg font-bold">{days}d</span>
                                    </Button>
                                  </DialogClose>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Extend trial */}
                          {sub?.status === 'trial' && (
                            <Button size="sm" variant="outline" onClick={() => handleAction(
                              () => extendTrial(u.userId, 7),
                              '+7 dias de trial adicionados!'
                            )}>
                              <RefreshCw size={12} className="mr-1.5" /> +7 dias
                            </Button>
                          )}

                          {/* Activate */}
                          {sub && sub.status !== 'active' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm">
                                  <UserCheck size={12} className="mr-1.5" /> Ativar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ativar assinatura?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ativar plano de {u.displayName || u.email}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleAction(
                                    () => updateSubscriptionStatus(u.userId, 'active'),
                                    'Plano ativado!'
                                  )}>Confirmar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Remove / Cancel */}
                          {sub && (sub.status === 'active' || sub.status === 'trial') && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 size={12} className="mr-1.5" /> Remover Plano
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover plano/trial?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    O acesso de {u.displayName || u.email} será revogado imediatamente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleAction(
                                      () => removeSubscription(u.userId),
                                      'Plano removido!'
                                    )}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Delete user */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700">
                                <Trash2 size={12} className="mr-1.5" /> Excluir Cliente
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir cliente permanentemente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Todos os dados de <strong>{u.displayName || u.email}</strong> serão excluídos permanentemente: matérias, atividades, anotações, frequência, materiais, conversas, assinatura e perfil. Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleAction(
                                    () => deleteUser(u.userId),
                                    `Cliente ${u.displayName || u.email} excluído com sucesso!`
                                  )}
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Excluir Permanentemente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <UserX size={24} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <Icon size={14} className="text-foreground/70 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] text-foreground/70 uppercase font-medium">{label}</p>
      <p className="text-sm font-medium truncate text-foreground">{value}</p>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) => (
  <div className="rounded-lg bg-foreground/5 border border-foreground/10 p-3 text-center">
    <Icon size={16} className="mx-auto text-foreground/50 mb-1" />
    <p className="text-xl font-black text-foreground">{value}</p>
    <p className="text-[10px] text-foreground/50">{label}</p>
  </div>
);
