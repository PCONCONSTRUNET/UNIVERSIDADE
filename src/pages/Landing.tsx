import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logoFull from '@/assets/logo-full.png';
import hakiAvatar from '@/assets/haki-avatar.png';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Sparkles,
  Brain,
  Check,
  X,
  Quote,
  Zap,
  Shield,
  Star,
  ChevronDown,
  FolderOpen,
  BarChart3,
  Target,
  Users,
} from 'lucide-react';

import { Flame } from 'lucide-react';

type PricingModal = 'trial' | 'plans' | null;

const Landing = () => {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState<PricingModal>(null);

  return (
    <div className="hakify-auth-bg !min-h-[100dvh] overflow-x-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + i * 3,
              height: 4 + i * 3,
              background: `rgba(55, 226, 138, ${0.15 + i * 0.04})`,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[420px] mx-auto px-5 pb-12">
        {/* Nav */}
        <nav className="flex items-center justify-between py-5">
          <img src={logoFull} alt="Study Hakify" className="h-7 object-contain" />
          <button
            onClick={() => navigate('/auth')}
            className="text-xs font-bold text-emerald-400/90 hover:text-emerald-300 border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 rounded-full backdrop-blur-sm transition-colors"
          >
            Já tenho conta
          </button>
        </nav>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-6 pb-10 text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto mb-5"
          >
            <img
              src={logoFull}
              alt="Study Hakify"
              className="h-32 mx-auto object-contain"
            />
          </motion.div>

          <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-tight text-white mb-2">
            Seu semestre organizado.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Sua média salva.
            </span>
          </h1>

          <p className="text-white/45 text-sm leading-relaxed max-w-[300px] mx-auto mb-1">
            <strong className="text-white/70">Haki</strong> — Tutor Oficial do Study Hakify
          </p>
          <p className="text-emerald-400/60 text-xs font-medium italic mb-7">
            "Organizando seu semestre. Salvando sua média."
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setOpenModal('trial')}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Começar teste grátis
            </button>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-white/70 border border-white/10 bg-white/5 backdrop-blur-sm active:scale-[0.98] transition-transform"
            >
              Ver planos — a partir de R$ 16,42/mês
            </button>
          </div>
        </motion.section>

        {/* Haki Chat Demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="pb-10"
        >
          <div className="hakify-auth-card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <img src={hakiAvatar} alt="Haki" className="w-8 h-8 rounded-xl object-cover" />
              <div>
                <p className="text-white text-sm font-bold leading-none">Haki</p>
                <p className="text-emerald-400/70 text-[10px] mt-0.5">Tutor IA • Online agora</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2.5">
              <ChatBubble sender="user" text="Quanto preciso na P2 de Cálculo?" />
              <ChatBubble
                sender="haki"
                text="Se sua P1 foi 5.0 e a média pra passar é 7.0, você precisa de pelo menos 9.0 na P2. Bora revisar? 📐"
              />
              <ChatBubble sender="user" text="Me explica integral por substituição" />
              <ChatBubble
                sender="haki"
                text="Boa! É como trocar uma peça do quebra-cabeça pra simplificar a conta. Vou te mostrar passo a passo... 🔥"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {['Tira dúvidas 24h', 'Conhece suas matérias', 'Alertas proativos'].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold text-emerald-300/80 bg-emerald-400/10 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="pb-10"
        >
          <SectionTitle text="Tudo que você precisa" />

          <div className="grid gap-3">
            <FeatureCard
              icon={<Brain className="w-5 h-5 text-emerald-400" />}
              title="Tutor IA integrado"
              desc="Tira dúvidas, calcula notas e te ajuda a estudar."
            />
            <FeatureCard
              icon={<CalendarDays className="w-5 h-5 text-cyan-400" />}
              title="Grade semanal"
              desc="Horários, matérias e locais em um só lugar."
            />
            <FeatureCard
              icon={<ClipboardCheck className="w-5 h-5 text-emerald-300" />}
              title="Tarefas com prazo"
              desc="Kanban com prioridade e status. Nada passa batido."
            />
            <FeatureCard
              icon={<Target className="w-5 h-5 text-orange-400" />}
              title="Prioridade inteligente"
              desc="O sistema ordena suas tarefas por prazo, peso e risco."
            />
            <FeatureCard
              icon={<Sparkles className="w-5 h-5 text-violet-400" />}
              title="IA analisa dificuldade"
              desc="A IA avalia o conteúdo e ajusta a prioridade automaticamente."
            />
            <FeatureCard
              icon={<BookOpen className="w-5 h-5 text-cyan-300" />}
              title="Notas e médias"
              desc="Provas, trabalhos e pesos. Cálculo automático."
            />
            <FeatureCard
              icon={<Sparkles className="w-5 h-5 text-yellow-400/80" />}
              title="Frequência"
              desc="Marca presença e avisa quando tá no limite."
            />
            <FeatureCard
              icon={<FolderOpen className="w-5 h-5 text-violet-400" />}
              title="Área de materiais"
              desc="Upload de PDFs, links de aula e organização por semana."
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5 text-sky-400" />}
              title="Relatório semanal"
              desc="Veja quanto estudou, quantas tarefas concluiu e como sua média evoluiu."
            />
            <FeatureCard
              icon={<Users className="w-5 h-5 text-pink-400" />}
              title="Modo grupo"
              desc="Crie grupos de estudo com chat, tarefas, enquetes e links compartilhados."
            />
          </div>
        </motion.section>

        {/* Comparison */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="pb-10"
        >
          <SectionTitle text="Por que é diferente?" />

          <div className="hakify-auth-card overflow-hidden">
            <div className="grid grid-cols-3 text-center text-[10px] font-bold border-b border-white/10 py-3 px-3">
              <span className="text-white/30 text-left">Recurso</span>
              <span className="text-emerald-400">Hakify</span>
              <span className="text-white/30">Outros</span>
            </div>
             {[
              { feature: 'Tutor com IA', us: true, them: false },
              { feature: 'Grade horários', us: true, them: true },
              { feature: 'Controle notas', us: true, them: true },
              { feature: 'Prioridade smart', us: true, them: false },
              { feature: 'IA na dificuldade', us: true, them: false },
              { feature: 'Materiais/PDFs', us: true, them: false },
              { feature: 'Relatório semanal', us: true, them: false },
              { feature: 'Modo grupo', us: true, them: false },
              { feature: 'Alertas smart', us: true, them: false },
              { feature: 'Score acadêmico', us: true, them: false },
            ].map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 items-center text-center py-2.5 px-3 text-[12px] ${
                  i % 2 === 0 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <span className="text-left text-white/60 font-medium">{row.feature}</span>
                <span>
                  {row.us ? (
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-white/15 mx-auto" />
                  )}
                </span>
                <span>
                  {row.them ? (
                    <Check className="w-4 h-4 text-white/25 mx-auto" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-white/15 mx-auto" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="pb-10"
        >
          <SectionTitle text="O que os estudantes dizem" />

          <div className="space-y-3">
            <Testimonial
              name="Marina S."
              course="Direito — 5º período"
              text="O Haki me salvou antes da prova de Constitucional. Explicou melhor que meu resumo."
            />
            <Testimonial
              name="Lucas R."
              course="Eng. Civil — 3º período"
              text="Uso pra organizar tudo. Mas o diferencial real é o tutor — ele sabe minhas matérias."
            />
            <Testimonial
              name="Ana C."
              course="Medicina — 2º período"
              text="É tipo ter um colega que nunca dorme e sempre sabe a resposta."
            />
          </div>
        </motion.section>

        {/* How it works */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="pb-10"
        >
          <SectionTitle text="Como funciona?" />

          <div className="grid gap-2.5">
            {[
              { n: '1', text: 'Cria sua conta (30 segundos)' },
              { n: '2', text: 'Cadastra matérias e horários' },
              { n: '3', text: 'Adiciona tarefas e marca presença' },
              { n: '4', text: 'Conversa com o Haki e estuda' },
            ].map((s) => (
              <div
                key={s.n}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"
              >
                <span className="w-7 h-7 rounded-lg bg-emerald-400/15 text-emerald-400 font-bold text-xs grid place-items-center shrink-0">
                  {s.n}
                </span>
                <span className="text-white/70 text-[13px] font-medium">{s.text}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Pricing CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          id="pricing"
          className="pb-10 scroll-mt-6"
        >
          <SectionTitle text="Escolha seu plano" />

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 space-y-4 shadow-xl shadow-black/20">
            {/* Divider top */}
            <div className="w-12 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto" />

            <div className="grid gap-3">
              {/* Annual - highlighted */}
              <div className="relative hakify-auth-card p-5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <div className="absolute -top-2.5 left-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    <Flame className="w-3 h-3" />
                    MAIS POPULAR
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <p className="text-white font-bold text-sm">Plano Anual</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-extrabold text-white">R$ 197</span>
                      <span className="text-white/30 text-xs">/ano</span>
                    </div>
                    <p className="text-emerald-400 text-[11px] font-semibold mt-0.5">R$ 16,42/mês • Economize R$ 101,80</p>
                  </div>
                  <Star className="w-6 h-6 text-emerald-400 fill-emerald-400 shrink-0" />
                </div>
                <button
                  onClick={() => navigate('/auth?plan=yearly')}
                  className="w-full mt-4 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  Assinar plano anual
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Monthly */}
              <div className="hakify-auth-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 font-bold text-sm">Plano Mensal</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-extrabold text-white">R$ 24,90</span>
                      <span className="text-white/30 text-xs">/mês</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/auth?plan=monthly')}
                  className="w-full mt-4 py-3 rounded-2xl font-semibold text-sm text-white/70 border border-white/10 bg-white/5 active:scale-[0.98] transition-transform"
                >
                  Assinar plano mensal
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-400/10 border border-emerald-400/20 px-4 py-2.5 text-center">
              <p className="text-emerald-300 text-[12px] font-semibold">
                ✨ Teste grátis por 7 dias • Sem cartão agora • Cancele quando quiser
              </p>
            </div>

            {/* Separator line */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="grid gap-2 text-left">
              {[
                'Tutor IA ilimitado (Haki)',
                'Grade, tarefas e frequência',
                'Notas com cálculo automático',
                'Prioridade inteligente por IA',
                'Análise de dificuldade automática',
                'Área de materiais e PDFs',
                'Relatório semanal automático',
                'Modo grupo com chat e tarefas',
                'Alertas e anotações com checklist',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[12px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="pb-10"
        >
          <SectionTitle text="Perguntas frequentes" />
          <div className="space-y-2">
            <FAQ q="Preciso de cartão de crédito?" a="Não. O teste grátis de 7 dias começa sem cartão." />
            <FAQ q="O Haki responde sobre qualquer matéria?" a="Sim! Ele conhece suas matérias cadastradas e pode ajudar com qualquer área do conhecimento." />
            <FAQ q="Funciona no celular?" a="100%. O app foi feito mobile-first, otimizado para o dia a dia do estudante." />
            <FAQ q="Posso cancelar a qualquer momento?" a="Sim, sem burocracia. Cancele quando quiser direto no app." />
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="py-10 border-t border-emerald-400/20 text-center space-y-4">
          <p className="text-white/40 text-xs tracking-wide">
            © <span className="text-emerald-400 font-black text-sm">{new Date().getFullYear()}</span>{' '}
            <span className="font-semibold text-cyan-300">Study Hakify</span> — Todos os direitos reservados
          </p>
          <div className="flex items-center justify-center gap-5">
            <a href="mailto:contato@studyhakify.com" className="h-8 w-8 rounded-full bg-emerald-400/10 border border-emerald-400/20 grid place-items-center text-emerald-400 hover:bg-emerald-400/20 hover:border-emerald-400/40 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </a>
            <a href="https://instagram.com/studyhakify" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full bg-pink-500/10 border border-pink-500/20 grid place-items-center text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/40 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="/termos" className="h-8 px-4 rounded-full bg-cyan-400/10 border border-cyan-400/20 grid place-items-center text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400/40 transition-all text-[11px] font-semibold tracking-wide">Termos</a>
          </div>
        </footer>
      </div>

      {/* Pricing Modals */}
      <AnimatePresence>
        {openModal && (
          <PricingModal
            type={openModal}
            onClose={() => setOpenModal(null)}
            onCta={(plan) => {
              setOpenModal(null);
              navigate(openModal === 'trial' ? '/auth' : `/auth?plan=${plan || 'monthly'}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Sub-components ─── */

const SectionTitle = ({ text }: { text: string }) => (
  <h2 className="text-lg font-bold text-white mb-4 text-center">{text}</h2>
);

const FeatureCard = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-white/[0.04] border border-white/[0.06]">
    <div className="shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-white/[0.06] grid place-items-center">
      {icon}
    </div>
    <div>
      <h3 className="text-white font-bold text-[13px] mb-0.5">{title}</h3>
      <p className="text-white/40 text-[12px] leading-relaxed m-0">{desc}</p>
    </div>
  </div>
);

const ChatBubble = ({ sender, text }: { sender: 'user' | 'haki'; text: string }) => (
  <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`rounded-2xl px-3 py-2 text-[11px] leading-relaxed max-w-[85%] ${
        sender === 'user'
          ? 'bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 text-white rounded-br-md'
          : 'bg-white/[0.08] text-white/80 rounded-bl-md'
      }`}
    >
      {text}
    </div>
  </div>
);

const Testimonial = ({ name, course, text }: { name: string; course: string; text: string }) => (
  <div className="hakify-auth-card p-4">
    <Quote className="w-3.5 h-3.5 text-emerald-400/30 mb-2" />
    <p className="text-white/60 text-[12px] leading-relaxed mb-3">"{text}"</p>
    <div>
      <p className="text-sm font-bold text-white/80">{name}</p>
      <p className="text-[10px] text-white/30">{course}</p>
    </div>
  </div>
);

const FAQ = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl bg-white/[0.04] border border-white/[0.06] overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-white/70 text-[13px] font-medium">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-3 text-white/40 text-[12px] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Pricing Modal ─── */

const PricingModal = ({
  type,
  onClose,
  onCta,
}: {
  type: 'trial' | 'plans';
  onClose: () => void;
  onCta: (plan?: string) => void;
}) => {
  const isTrial = type === 'trial';
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hakify-auth-card w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 grid place-items-center text-white/40 hover:text-white/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5 sm:hidden" />

        <div className="text-center mb-5">
          {isTrial ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 grid place-items-center mx-auto mb-3">
                <Zap className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-1">Teste Grátis</h3>
              <p className="text-white/40 text-sm">7 dias completos, sem cartão de crédito</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 grid place-items-center mx-auto mb-3">
                <Star className="w-7 h-7 text-emerald-400 fill-emerald-400" />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-1">Escolha seu plano</h3>
              <p className="text-white/40 text-sm">Acesso total a todas as funcionalidades</p>
            </>
          )}
        </div>

        {/* Plan selector (only for plans modal) */}
        {!isTrial && (
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`rounded-xl p-3 text-left border-2 transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-white/30 bg-white/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'
              }`}
            >
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Mensal</p>
              <p className="text-lg font-extrabold text-white mt-1">R$ 24,90</p>
              <p className="text-[10px] text-white/30">/mês</p>
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`relative rounded-xl p-3 text-left border-2 transition-all ${
                selectedPlan === 'yearly'
                  ? 'border-emerald-500/50 bg-emerald-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'
              }`}
            >
              <div className="absolute -top-2 right-2">
                <span className="text-[8px] font-bold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 px-2 py-0.5 rounded-full">
                  -34%
                </span>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Anual</p>
              <p className="text-lg font-extrabold text-white mt-1">R$ 197</p>
              <p className="text-[10px] text-emerald-400 font-semibold">R$ 16,42/mês</p>
            </button>
          </div>
        )}

        {!isTrial && selectedPlan === 'yearly' && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 mb-5 text-center">
            <p className="text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              Economize R$ 101,80 por ano
            </p>
          </div>
        )}

        <div className="grid gap-2.5 mb-6">
          {[
            { text: 'Acesso total a todas as funcionalidades', icon: Shield },
            { text: 'Haki — Tutor IA ilimitado', icon: Brain },
            { text: 'Grade, tarefas, notas e frequência', icon: CalendarDays },
            { text: 'Alertas e anotações inteligentes', icon: Sparkles },
            ...(isTrial
              ? [{ text: 'Sem compromisso — cancele quando quiser', icon: Check }]
              : [{ text: 'Suporte prioritário', icon: Star }]),
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/10 grid place-items-center shrink-0">
                <item.icon className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-white/60 text-[12px] font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onCta(isTrial ? undefined : selectedPlan)}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          {isTrial ? 'Criar conta grátis' : selectedPlan === 'yearly' ? 'Assinar plano anual' : 'Assinar plano mensal'}
          <ArrowRight className="w-4 h-4" />
        </button>

        {isTrial && (
          <p className="text-center text-emerald-400/80 text-[11px] font-semibold mt-3">
            ✨ Após 7 dias, escolha seu plano. Cancele quando quiser.
          </p>
        )}
        {!isTrial && (
          <p className="text-center text-white/30 text-[10px] mt-3">
            Pagamento seguro via Mercado Pago • Sem fidelidade
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Landing;
