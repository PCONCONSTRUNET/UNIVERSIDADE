import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate, useSearchParams, Link } from 'react-router-dom';
import logo from '@/assets/logo-full.png';

type AuthView = 'login' | 'register' | 'forgot';

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');
  const refCode = searchParams.get('ref');
  const [view, setView] = useState<AuthView>(plan || refCode ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={plan ? `/?plan=${plan}` : '/'} replace />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, referred_by_code: refCode || undefined },
          },
        });
        if (error) throw error;

        // If there's a referral code, create the referral record
        if (refCode && signUpData.user) {
          const { data: referrerId } = await supabase.rpc('find_referrer_by_code', { _code: refCode });
          if (referrerId && referrerId !== signUpData.user.id) {
            await supabase.from('referrals').insert({
              referrer_id: referrerId,
              referred_id: signUpData.user.id,
              status: 'pending',
            } as any);
            // Save referred_by on profile
            await supabase.from('profiles').update({
              referred_by: referrerId,
            } as any).eq('user_id', signUpData.user.id);
          }
        }

        navigate(plan ? `/?plan=${plan}` : '/', { replace: true });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: '📧 Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setView('login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hakify-auth-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hakify-auth-card w-full max-w-sm space-y-4 p-6 relative z-10"
      >
        <div className="text-center space-y-1">
          <img src={logo} alt="Study Hakify" className="mx-auto h-20 w-auto" />
          <p className="text-sm text-white/60">
            {view === 'login' ? 'Entre na sua conta' : view === 'register' ? 'Crie sua conta' : 'Recupere sua senha'}
          </p>
        </div>

        {view === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80">Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-emerald-400/50"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
            <button
              type="button"
              onClick={() => setView('login')}
              className="flex items-center gap-1 text-sm text-white/50 hover:text-emerald-400 mx-auto"
            >
              <ArrowLeft size={14} /> Voltar ao login
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {view === 'register' && (
                <div className="space-y-2">
                  <Label className="text-white/80">Nome</Label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <Input
                      placeholder="Seu nome"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-emerald-400/50"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-white/80">Email</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-emerald-400/50"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white/80">Senha</Label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs text-emerald-400/70 hover:text-emerald-400"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-emerald-400/50"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0" disabled={loading}>
                {loading ? 'Carregando...' : view === 'login' ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>

            <div className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-center">
              <p className="text-sm text-white/60">
                {view === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
                <button
                  onClick={() => setView(view === 'login' ? 'register' : 'login')}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  {view === 'login' ? 'Cadastre-se' : 'Faça login'}
                </button>
              </p>
            </div>
          </>
        )}

        <div className="space-y-3 pt-2">
          <p className="text-center text-xs text-white/60">
            Ao usar o Study Hakify, você concorda com nossos{' '}
            <Link to="/termos" className="underline text-emerald-400/80 hover:text-emerald-400">Termos de Uso e Política de Privacidade</Link>.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="mailto:studyhakify@gmail.com" className="text-white/60 hover:text-emerald-400 transition-colors" title="Email de suporte">
              <Mail size={20} />
            </a>
            <a href="https://www.instagram.com/studyhakify/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-emerald-400 transition-colors" title="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
