import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-full.png';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'As senhas não coincidem.',
      });
      return;
    }
    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast({ title: '✅ Senha alterada com sucesso!' });
      setTimeout(() => navigate('/', { replace: true }), 2000);
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
        className="hakify-auth-card w-full max-w-sm space-y-6 p-8 relative z-10"
      >
        <div className="text-center space-y-2">
          <img src={logo} alt="Study Hakify" className="mx-auto h-32 w-auto" />
          <p className="text-sm text-white/60">
            {success ? 'Senha redefinida!' : 'Defina sua nova senha'}
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="mx-auto text-emerald-400" />
            <p className="text-white/70 text-sm">Redirecionando...</p>
          </div>
        ) : !isRecovery ? (
          <div className="text-center space-y-4">
            <p className="text-white/60 text-sm">
              Link inválido ou expirado. Solicite um novo link de recuperação.
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0"
            >
              Ir para o login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80">Nova senha</Label>
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
            <div className="space-y-2">
              <Label className="text-white/80">Confirmar senha</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-emerald-400/50"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white border-0" disabled={loading}>
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
