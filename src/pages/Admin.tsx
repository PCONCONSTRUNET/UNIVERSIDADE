import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, CreditCard, ClipboardList,
  Shield, Lock, ArrowLeft, LogOut, User, Crown, Receipt, Wallet, Gift,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import logoFull from '@/assets/logo-full.png';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminClients } from '@/components/admin/AdminClients';
import { AdminPayments } from '@/components/admin/AdminPayments';
import { AdminAudit } from '@/components/admin/AdminAudit';
import { AdminSubscriptions } from '@/components/admin/AdminSubscriptions';
import { AdminFinanceiro } from '@/components/admin/AdminFinanceiro';
import { AdminReferrals } from '@/components/admin/AdminReferrals';

type AdminTab = 'dashboard' | 'clients' | 'subscriptions' | 'financeiro' | 'payments' | 'referrals' | 'audit';

const NAV_ITEMS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'subscriptions', label: 'Assinaturas', icon: Crown },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet },
  { id: 'payments', label: 'Pagamentos', icon: Receipt },
  { id: 'referrals', label: 'Indicações', icon: Gift },
  { id: 'audit', label: 'Auditoria', icon: ClipboardList },
];

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (email.toLowerCase() !== 'lucaspereirabn10@gmail.com') {
      setError('Acesso negado. Apenas o e-mail administrador principal pode acessar este painel.');
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hakify-auth-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hakify-auth-card w-full max-w-sm space-y-6 p-8 relative z-10"
      >
        <div className="text-center space-y-3">
          <img src={logoFull} alt="Study Hakify" className="mx-auto h-28 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-white">Painel Admin</h1>
            <p className="text-sm text-white/60">Acesso restrito</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/80">E-mail</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="seu@email.admin"
                className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-emerald-400/50"
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/80">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Digite a senha"
                className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-emerald-400/50"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0">
            {loading ? 'Acessando...' : <><Lock size={14} className="mr-2" /> Entrar</>}
          </Button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="text-xs text-white/50 hover:text-white/80 transition-colors w-full text-center"
        >
          ← Voltar ao app
        </button>
      </motion.div>
    </div>
  );
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const adminData = useAdmin();

  if (authLoading || adminData.loading) {
    return (
      <div className="min-h-screen bg-[#061B3A] flex items-center justify-center">
        <div className="animate-pulse text-white/60">Verificando credenciais de administrador...</div>
      </div>
    );
  }

  if (!user || user.email !== 'lucaspereirabn10@gmail.com' || !adminData.isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="admin-panel min-h-screen bg-background flex">
      {/* Animated background — same as auth */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(900px 500px at 20% 20%, rgba(53,209,255,.16), transparent 55%),
            radial-gradient(800px 450px at 80% 25%, rgba(55,226,138,.10), transparent 55%),
            radial-gradient(700px 450px at 55% 80%, rgba(199,255,91,.06), transparent 60%),
            linear-gradient(160deg, #061B3A 0%, #071b2b 45%, #041327 100%)
          `,
        }} />
      </div>

      {/* Sidebar */}
      <aside className="admin-sidebar w-60 flex flex-col shrink-0 sticky top-0 h-screen z-10">
        <div className="p-4 border-b border-white/[0.08] flex items-center gap-2">
          <img src={logoFull} alt="Study Hakify" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.08] space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:bg-white/[0.05] hover:text-white/80 transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar ao app
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Sair do admin
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto z-10 relative">
        <header className="admin-header sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{NAV_ITEMS.find(i => i.id === activeTab)?.label}</h1>
          <img src={logoFull} alt="Logo" className="h-5 opacity-40" />
        </header>

        <div className="p-6">
          {activeTab === 'dashboard' && <AdminDashboard metrics={adminData.metrics} users={adminData.users} payments={adminData.payments} />}
          {activeTab === 'clients' && <AdminClients adminData={adminData} />}
          {activeTab === 'subscriptions' && (
            <AdminSubscriptions
              users={adminData.users}
              onGrantPlan={adminData.grantPlan}
              onGrantTrial={adminData.grantTrial}
              onExtendTrial={adminData.extendTrial}
              onRemoveSubscription={adminData.removeSubscription}
              onRefresh={adminData.fetchUsers}
            />
          )}
          {activeTab === 'financeiro' && (
            <AdminFinanceiro
              payments={adminData.payments}
              onRefresh={adminData.fetchUsers}
            />
          )}
          {activeTab === 'payments' && (
            <AdminPayments
              payments={adminData.payments}
              onRefresh={adminData.fetchUsers}
            />
          )}
          {activeTab === 'audit' && <AdminAudit users={adminData.users} payments={adminData.payments} referrals={adminData.referrals} auditLogs={adminData.auditLogs} onRefresh={adminData.fetchAuditLogs} />}
          {activeTab === 'referrals' && (
            <AdminReferrals
              referrals={adminData.referrals}
              onRefresh={adminData.fetchUsers}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
