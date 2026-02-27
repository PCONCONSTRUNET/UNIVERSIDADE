import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { X, ShieldCheck, Loader2, Crown, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import logo from '@/assets/logo-full.png';

interface CheckoutBricksProps {
  plan: string;
  planLabel: string;
  amount: number;
  periodLabel: string;
  months: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface PixData {
  qrCode: string;
  qrCodeBase64: string;
  expirationDate?: string;
}

const CheckoutBricks = React.forwardRef<HTMLDivElement, CheckoutBricksProps>(({ plan, planLabel, amount, periodLabel, months, onClose, onSuccess }, ref) => {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const [mpReady, setMpReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'approved' | 'rejected' | 'pending' | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    const loadPublicKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mp-public-key');
        if (error) throw error;
        if (data?.publicKey) {
          initMercadoPago(data.publicKey, { locale: 'pt-BR' });
          setMpReady(true);
        }
      } catch (err) {
        console.error('Error loading MP public key:', err);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o checkout.' });
      }
    };
    loadPublicKey();
  }, [toast]);

  const handleCopyPix = useCallback(() => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast({ title: 'Código PIX copiado!' });
      setTimeout(() => setCopied(false), 3000);
    }
  }, [pixData, toast]);

  const handleSubmit = useCallback(async (formData: any) => {
    if (!session || submittingRef.current) return;
    submittingRef.current = true;
    setProcessing(true);
    setPaymentSubmitted(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { ...formData, plan, months },
      });
      if (error) throw error;

      if (data.status === 'approved') {
        setPaymentResult('approved');
        toast({ title: '✅ Pagamento aprovado!', description: 'Sua assinatura foi ativada.' });
        setTimeout(() => onSuccess(), 2000);
      } else if (data.status === 'pending' || data.status === 'in_process') {
        // Check if PIX data is available
        const txData = data.point_of_interaction?.transaction_data;
        if (txData) {
          setPixData({
            qrCode: txData.qr_code || '',
            qrCodeBase64: txData.qr_code_base64 || '',
            expirationDate: txData.expiration_date,
          });
        }
        setPaymentResult('pending');
        toast({ title: '⏳ Pagamento pendente', description: 'Escaneie o QR Code ou copie o código PIX.' });
      } else {
        setPaymentResult('rejected');
        toast({ variant: 'destructive', title: 'Pagamento recusado', description: data.status_detail || 'Tente novamente com outro método.' });
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast({ variant: 'destructive', title: 'Erro no pagamento', description: 'Tente novamente.' });
    } finally {
      setProcessing(false);
    }
  }, [session, toast, onSuccess]);

  const handleError = useCallback((error: any) => {
    console.error('Brick error:', error);
  }, []);

  // Approved state
  if (paymentResult === 'approved') {
    return (
      <div className="min-h-screen hakify-auth-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hakify-auth-card w-full max-w-md text-center space-y-4 p-8 relative z-10"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Pagamento aprovado!</h2>
          <p className="text-white/60 text-sm">Sua assinatura foi ativada com sucesso.</p>
        </motion.div>
      </div>
    );
  }

  // PIX pending state - show QR code
  if (paymentResult === 'pending' && pixData) {
    return (
      <div className="min-h-screen hakify-auth-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hakify-auth-card w-full max-w-md p-6 relative z-10 space-y-5"
        >
          <div className="flex items-center justify-between">
            <img src={logo} alt="Study Hakify" className="h-14 w-auto" />
            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 transition-colors">
              <X size={20} className="text-white/60" />
            </button>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white">Pagamento via PIX</h2>
            <p className="text-sm text-white/50">Escaneie o QR Code ou copie o código abaixo</p>
          </div>

          {/* QR Code */}
          {pixData.qrCodeBase64 && (
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-4">
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            </div>
          )}

          {/* Copy paste code */}
          {pixData.qrCode && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 text-center">Código copia e cola</p>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2">
                <code className="text-xs text-white/70 flex-1 break-all line-clamp-2">
                  {pixData.qrCode}
                </code>
                <button
                  onClick={handleCopyPix}
                  className="shrink-0 rounded-full p-2 bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
                >
                  {copied ? (
                    <Check size={16} className="text-emerald-400" />
                  ) : (
                    <Copy size={16} className="text-emerald-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-xs text-amber-300/80 text-center">
              ⏳ O pagamento será confirmado automaticamente após a transferência. O código expira em 30 minutos.
            </p>
          </div>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <p className="text-xs font-medium text-emerald-300/90">
              Pagamento seguro processado pelo Mercado Pago
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hakify-auth-bg flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hakify-auth-card w-full max-w-md my-8 p-6 relative z-10 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <img src={logo} alt="Study Hakify" className="h-14 w-auto" />
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white">Finalizar assinatura</h2>
          <p className="text-sm text-white/50">Acesso completo ao Study Hakify</p>
        </div>

        {/* Plan summary */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center">
                <Crown size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{planLabel}</p>
                <p className="text-xs text-white/50">Renovação automática</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">R$ {amount.toFixed(2).replace('.', ',')}</p>
              <p className="text-[10px] text-white/40">{periodLabel}</p>
            </div>
          </div>
        </div>

        {/* MP Brick */}
        {/* MP Brick - hide after submission */}
        {!mpReady ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="ml-2 text-sm text-white/50">Carregando checkout...</span>
          </div>
        ) : paymentSubmitted ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm text-white/70 font-medium">Processando seu pagamento...</p>
            <p className="text-xs text-white/40">Aguarde, não feche esta página.</p>
          </div>
        ) : (
          <div className="checkout-bricks-container rounded-xl overflow-hidden">
            <Payment
              initialization={{
                amount: amount,
                payer: {
                  email: user?.email || '',
                  entityType: 'individual',
                },
              }}
              customization={{
                paymentMethods: {
                  creditCard: 'all',
                  bankTransfer: 'all',
                },
                visual: {
                  style: {
                    theme: 'dark',
                    customVariables: {
                      formBackgroundColor: 'transparent',
                      baseColor: '#37E28A',
                    },
                  },
                },
              }}
              onSubmit={handleSubmit}
              onError={handleError}
            />
          </div>
        )}

        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <p className="text-xs font-medium text-emerald-300/90">
            Pagamento seguro processado pelo Mercado Pago
          </p>
        </div>
      </motion.div>
    </div>
  );
});

CheckoutBricks.displayName = 'CheckoutBricks';

export default CheckoutBricks;
