import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-full.png';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </button>
          <img src={logo} alt="Study Hakify" className="h-8" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Termos de Uso */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center">
                <FileText size={20} className="text-primary" />
              </div>
              <h1 className="text-2xl font-black">Termos de Uso</h1>
            </div>
            <p className="text-xs text-muted-foreground">Última atualização: 23 de fevereiro de 2026</p>

            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <h2 className="text-lg font-bold text-foreground">1. Aceitação dos Termos</h2>
              <p>Ao acessar e utilizar o Study Hakify, você concorda com estes Termos de Uso. Se não concordar, não utilize a plataforma.</p>

              <h2 className="text-lg font-bold text-foreground">2. Descrição do Serviço</h2>
              <p>O Study Hakify é uma plataforma digital de organização acadêmica que oferece ferramentas para gerenciamento de disciplinas, atividades, notas, frequência, materiais de estudo e assistente de IA para estudantes universitários.</p>

              <h2 className="text-lg font-bold text-foreground">3. Cadastro e Conta</h2>
              <p>Você é responsável por manter a confidencialidade de suas credenciais de acesso. Todas as atividades realizadas em sua conta são de sua responsabilidade. Você deve fornecer informações verdadeiras e atualizadas durante o cadastro.</p>

              <h2 className="text-lg font-bold text-foreground">4. Planos e Pagamentos</h2>
              <p>O Study Hakify oferece um período de teste gratuito de 7 dias. Após o período de teste, é necessário assinar o plano mensal de R$ 24,90 para continuar utilizando a plataforma. Os pagamentos são processados pelo Mercado Pago. A assinatura tem renovação mensal e pode ser cancelada a qualquer momento.</p>

              <h2 className="text-lg font-bold text-foreground">5. Uso Permitido</h2>
              <p>Você se compromete a utilizar a plataforma apenas para fins lícitos e acadêmicos. É proibido: compartilhar credenciais de acesso, usar a plataforma para fins ilegais, tentar acessar dados de outros usuários, ou realizar engenharia reversa do sistema.</p>

              <h2 className="text-lg font-bold text-foreground">6. Propriedade Intelectual</h2>
              <p>Todo o conteúdo, design, código e funcionalidades do Study Hakify são de propriedade exclusiva da plataforma. Os dados e conteúdos criados por você (notas, atividades, etc.) permanecem de sua propriedade.</p>

              <h2 className="text-lg font-bold text-foreground">7. Limitação de Responsabilidade</h2>
              <p>O Study Hakify é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. Não nos responsabilizamos por perdas decorrentes do uso da plataforma, incluindo perda de dados acadêmicos.</p>

              <h2 className="text-lg font-bold text-foreground">8. Cancelamento</h2>
              <p>Você pode cancelar sua assinatura a qualquer momento. Após o cancelamento, seu acesso permanecerá ativo até o final do período já pago. Seus dados serão mantidos por 30 dias após o cancelamento, podendo ser excluídos permanentemente após esse prazo.</p>

              <h2 className="text-lg font-bold text-foreground">9. Modificações</h2>
              <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por email ou notificação na plataforma.</p>
            </div>
          </section>

          {/* Separador */}
          <div className="my-10 border-t border-border" />

          {/* Política de Privacidade */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 grid place-items-center">
                <Shield size={20} className="text-emerald-500" />
              </div>
              <h1 className="text-2xl font-black">Política de Privacidade</h1>
            </div>
            <p className="text-xs text-muted-foreground">Última atualização: 23 de fevereiro de 2026</p>

            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <h2 className="text-lg font-bold text-foreground">1. Dados Coletados</h2>
              <p>Coletamos os seguintes dados pessoais: nome, endereço de email, dados de pagamento (processados pelo Mercado Pago), e dados acadêmicos inseridos voluntariamente por você (disciplinas, notas, atividades, frequência, materiais e anotações).</p>

              <h2 className="text-lg font-bold text-foreground">2. Uso dos Dados</h2>
              <p>Seus dados são utilizados para: fornecer e manter o serviço, processar pagamentos, personalizar sua experiência, enviar comunicações relacionadas ao serviço, e melhorar a plataforma.</p>

              <h2 className="text-lg font-bold text-foreground">3. Armazenamento e Segurança</h2>
              <p>Seus dados são armazenados em servidores seguros fornecidos pela Supabase, com criptografia em trânsito e em repouso. Implementamos políticas de Row Level Security (RLS) que garantem que cada usuário só pode acessar seus próprios dados.</p>

              <h2 className="text-lg font-bold text-foreground">4. Compartilhamento de Dados</h2>
              <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto: Mercado Pago (processamento de pagamentos), provedores de infraestrutura (hospedagem), e quando exigido por lei.</p>

              <h2 className="text-lg font-bold text-foreground">5. Assistente de IA</h2>
              <p>O assistente de IA (Haki) processa suas perguntas para gerar respostas. As conversas são armazenadas em sua conta e não são utilizadas para treinar modelos de IA. Você pode excluir suas conversas a qualquer momento.</p>

              <h2 className="text-lg font-bold text-foreground">6. Seus Direitos (LGPD)</h2>
              <p>Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a: acessar seus dados, corrigir dados incorretos, solicitar a exclusão de seus dados, revogar consentimento, e solicitar portabilidade dos dados.</p>

              <h2 className="text-lg font-bold text-foreground">7. Cookies</h2>
              <p>Utilizamos cookies essenciais para manter sua sessão de login ativa. Não utilizamos cookies de rastreamento ou publicidade.</p>

              <h2 className="text-lg font-bold text-foreground">8. Contato</h2>
              <p>Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato:</p>
              <div className="flex flex-col gap-2 mt-2">
                <a href="mailto:studyhakify@gmail.com" className="inline-flex items-center gap-2 text-primary hover:underline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  studyhakify@gmail.com
                </a>
                <a href="https://www.instagram.com/studyhakify/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  @studyhakify
                </a>
              </div>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default Terms;
