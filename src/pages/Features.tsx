import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, AlertTriangle, Users, Target, ChevronLeft, ChevronRight,
  Sparkles, ArrowRight, CalendarDays, ClipboardCheck, StickyNote,
  CheckSquare, FolderOpen, Bot, Trophy, TrendingUp, GraduationCap, Share2, Zap,
} from 'lucide-react';
import logoFull from '@/assets/logo-full.png';

const features = [
  {
    icon: BarChart3,
    emoji: '📊',
    title: 'Simulador de Nota',
    subtitle: 'Saiba exatamente o que precisa para passar',
    description: 'Calcule automaticamente a nota mínima necessária em cada prova e trabalho. Considera pesos, médias parciais e critérios da sua instituição.',
    highlights: [
      'Cálculo automático de nota mínima',
      'Simulação por peso de atividade',
      'Projeção de cenários (otimista, realista, pessimista)',
      'Acompanhamento em tempo real',
    ],
    gradient: 'from-primary to-blue-500',
    textAccent: 'text-primary',
  },
  {
    icon: AlertTriangle,
    emoji: '⚠️',
    title: 'Indicador de Risco',
    subtitle: 'Nunca mais seja pego de surpresa',
    description: 'Alertas inteligentes quando sua frequência ou notas estiverem abaixo do necessário. Análise em tempo real do seu desempenho.',
    highlights: [
      'Alerta de frequência mínima (75%)',
      'Monitoramento de notas por matéria',
      'Classificação: seguro, atenção, crítico',
      'Sugestões personalizadas de recuperação',
    ],
    gradient: 'from-warning to-orange-500',
    textAccent: 'text-warning',
  },
  {
    icon: Bot,
    emoji: '🤖',
    title: 'Haki — IA de Estudos',
    subtitle: 'Seu assistente acadêmico pessoal',
    description: 'Converse com a Haki para tirar dúvidas, gerar resumos, criar planos de estudo e receber dicas personalizadas com base no seu desempenho.',
    highlights: [
      'Tira-dúvidas instantâneo',
      'Geração de resumos e explicações',
      'Contexto das suas matérias reais',
      'Disponível 24h no seu bolso',
    ],
    gradient: 'from-emerald-400 to-teal-500',
    textAccent: 'text-accent',
  },
  {
    icon: CalendarDays,
    emoji: '📅',
    title: 'Grade Horária',
    subtitle: 'Sua semana organizada de forma visual',
    description: 'Cadastre suas matérias com horários, salas e professores. Visualize toda a semana de forma clara e nunca perca uma aula.',
    highlights: [
      'Visualização semanal completa',
      'Cadastro de sala e professor',
      'Cores por matéria para fácil identificação',
      'Carga horária automática',
    ],
    gradient: 'from-sky-400 to-blue-500',
    textAccent: 'text-sky-400',
  },
  {
    icon: ClipboardCheck,
    emoji: '✅',
    title: 'Gestão de Atividades',
    subtitle: 'Kanban acadêmico para suas tarefas',
    description: 'Organize provas, trabalhos e listas com quadro Kanban. Prioridade inteligente por IA destaca o que precisa da sua atenção primeiro.',
    highlights: [
      'Quadro Kanban (pendente, fazendo, feito)',
      'Prioridade inteligente por IA',
      'Filtros por matéria e tipo',
      'Subtarefas e pesos de nota',
    ],
    gradient: 'from-violet-500 to-purple-600',
    textAccent: 'text-violet-400',
  },
  {
    icon: StickyNote,
    emoji: '📝',
    title: 'Notas & Anotações',
    subtitle: 'Capture tudo durante a aula',
    description: 'Crie anotações organizadas por matéria, com cores personalizáveis, checklists e fixação. Anotação rápida com um toque durante a aula.',
    highlights: [
      'Anotação rápida com ⚡ Quick Note',
      'Organização por matéria e categoria',
      'Cores e tamanho de fonte personalizáveis',
      'Checklists integrados',
    ],
    gradient: 'from-amber-400 to-yellow-500',
    textAccent: 'text-amber-400',
  },
  {
    icon: CheckSquare,
    emoji: '📋',
    title: 'Controle de Presença',
    subtitle: 'Nunca reprove por falta',
    description: 'Registre sua presença em cada aula e acompanhe o percentual por matéria. Alertas automáticos quando estiver perto do limite.',
    highlights: [
      'Registro rápido de presença',
      'Percentual de frequência por matéria',
      'Alerta de risco de reprovação por falta',
      'Histórico completo de presenças',
    ],
    gradient: 'from-green-400 to-emerald-500',
    textAccent: 'text-green-400',
  },
  {
    icon: Users,
    emoji: '👥',
    title: 'Modo Grupo',
    subtitle: 'Estude junto, vá mais longe',
    description: 'Crie grupos de estudo, compartilhe materiais, organize tarefas e se comunique com colegas. Tudo integrado ao seu planejamento.',
    highlights: [
      'Chat em grupo com colegas',
      'Compartilhamento de materiais e links',
      'Tarefas colaborativas com responsáveis',
      'Enquetes para decisões do grupo',
    ],
    gradient: 'from-cyan-400 to-blue-500',
    textAccent: 'text-cyan-400',
  },
  {
    icon: FolderOpen,
    emoji: '📚',
    title: 'Materiais de Estudo',
    subtitle: 'Tudo em um só lugar',
    description: 'Faça upload de PDFs, slides e documentos organizados por matéria e semana. Acesse rapidamente tudo que precisa para estudar.',
    highlights: [
      'Upload de arquivos (PDF, docs, imagens)',
      'Organização por matéria e semana',
      'Links externos para materiais online',
      'Busca rápida de materiais',
    ],
    gradient: 'from-rose-400 to-pink-500',
    textAccent: 'text-rose-400',
  },
  {
    icon: Target,
    emoji: '🎯',
    title: 'Metas Inteligentes',
    subtitle: 'Transforme objetivos em conquistas',
    description: 'Defina metas semanais de estudo e acompanhe seu progresso. O sistema sugere ajustes para manter você no caminho certo.',
    highlights: [
      'Metas semanais personalizáveis',
      'Progresso visual com gráficos',
      'Ajustes inteligentes de ritmo',
      'Histórico de cumprimento',
    ],
    gradient: 'from-purple-500 to-primary',
    textAccent: 'text-purple-400',
  },
  {
    icon: Trophy,
    emoji: '🏆',
    title: 'Gamificação',
    subtitle: 'Estude com motivação extra',
    description: 'Ganhe XP, mantenha streaks de estudo e desbloqueie conquistas. Transforme sua rotina acadêmica em algo divertido e motivador.',
    highlights: [
      'Sistema de XP e níveis',
      'Streaks diários de estudo',
      'Conquistas desbloqueáveis',
      'Ranking e desafios',
    ],
    gradient: 'from-yellow-400 to-amber-500',
    textAccent: 'text-yellow-400',
  },
  {
    icon: TrendingUp,
    emoji: '📈',
    title: 'Relatório Semanal',
    subtitle: 'Acompanhe sua evolução',
    description: 'Todo domingo receba um resumo do que você fez na semana: horas estudadas, tarefas concluídas, frequência e progresso nas metas.',
    highlights: [
      'Resumo semanal automático',
      'Gráficos de desempenho',
      'Comparação com semanas anteriores',
      'Dicas de melhoria personalizadas',
    ],
    gradient: 'from-indigo-400 to-blue-600',
    textAccent: 'text-indigo-400',
  },
  {
    icon: GraduationCap,
    emoji: '🎓',
    title: 'Score Acadêmico',
    subtitle: 'Sua nota geral em um número',
    description: 'Um índice que combina suas notas, frequência e metas para mostrar sua performance acadêmica geral de forma simples e visual.',
    highlights: [
      'Índice único de performance',
      'Combina notas + frequência + metas',
      'Evolução ao longo do semestre',
      'Benchmark de excelência',
    ],
    gradient: 'from-teal-400 to-cyan-500',
    textAccent: 'text-teal-400',
  },
  {
    icon: Share2,
    emoji: '🔗',
    title: 'Programa de Indicação',
    subtitle: 'Indique amigos e ganhe benefícios',
    description: 'Compartilhe seu código de indicação com colegas. Quando eles assinam, você ganha meses grátis no plano premium automaticamente.',
    highlights: [
      'Código de indicação único',
      'Recompensa automática ao converter',
      'Notificação quando amigo assina',
      'Painel de acompanhamento de indicações',
    ],
    gradient: 'from-fuchsia-500 to-pink-500',
    textAccent: 'text-fuchsia-400',
  },
];

const Features = () => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((p) => (p + 1) % features.length);
  const prev = () => setCurrent((p) => (p - 1 + features.length) % features.length);

  const feature = features[current];
  const Icon = feature.icon;

  return (
    <div className="min-h-screen bg-[#061B3A] text-white overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-accent/15 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-center py-6 px-4">
          <img src={logoFull} alt="Study Hakify" className="h-8" />
        </header>

        {/* Title */}
        <div className="text-center px-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium mb-3"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            {features.length} Funcionalidades
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-bold tracking-tight"
          >
            Tudo que você precisa para{' '}
            <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
              mandar bem
            </span>
          </motion.h1>
        </div>

        {/* Carousel */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              {/* Feature card */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 sm:p-7">
                {/* Icon + counter */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{feature.emoji}</span>
                    <span className="text-xs text-white/40 font-medium tabular-nums">
                      {current + 1}/{features.length}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold mb-0.5">{feature.title}</h2>
                <p className={`text-xs font-medium ${feature.textAccent} mb-2`}>{feature.subtitle}</p>
                <p className="text-sm text-white/65 leading-relaxed mb-4">{feature.description}</p>

                {/* Highlights */}
                <div className="space-y-2">
                  {feature.highlights.map((h, i) => (
                    <motion.div
                      key={h}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      className="flex items-start gap-2"
                    >
                      <div className={`w-4.5 h-4.5 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-xs text-white/75">{h}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center gap-4 mt-5">
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="flex gap-1.5 flex-wrap justify-center max-w-[180px]">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? 'w-5 bg-accent' : 'w-1.5 bg-white/25'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* CTA */}
          <motion.a
            href="/landing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-shadow"
          >
            Começar agora
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </div>

        {/* Footer */}
        <footer className="text-center py-3 text-xs text-white/30">
          © {new Date().getFullYear()} Study Hakify
        </footer>
      </div>
    </div>
  );
};

export default Features;
