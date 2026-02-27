import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, CheckSquare, GraduationCap, 
  UserCheck, StickyNote, Users, FolderOpen, User, 
  Zap, MessageCircle, ChevronRight, ChevronLeft, X, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import hakiAvatar from '@/assets/haki-avatar.png';

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const steps: OnboardingStep[] = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Sua central de comando! Veja aulas do dia, atividades pendentes, score acadêmico e alertas inteligentes.',
    color: 'hsl(var(--primary))',
  },
  {
    icon: Calendar,
    title: 'Horários',
    description: 'Monte seu quadro de horários semanal com matérias, professores e salas. Tudo organizado por cor.',
    color: '#3b82f6',
  },
  {
    icon: CheckSquare,
    title: 'Tarefas',
    description: 'Gerencie provas, trabalhos, seminários e exercícios. Prioridade inteligente por IA e prazos visuais.',
    color: '#10b981',
  },
  {
    icon: GraduationCap,
    title: 'Notas',
    description: 'Acompanhe suas notas por matéria, veja quanto precisa tirar na próxima prova para atingir sua meta.',
    color: '#8b5cf6',
  },
  {
    icon: UserCheck,
    title: 'Frequência',
    description: 'Registre presença nas aulas e monitore o percentual de cada matéria para não reprovar por falta.',
    color: '#f59e0b',
  },
  {
    icon: StickyNote,
    title: 'Anotações',
    description: 'Crie notas de aula, listas de estudo e organize por matéria. Use a anotação rápida com o botão ⚡.',
    color: '#ec4899',
  },
  {
    icon: Users,
    title: 'Grupos',
    description: 'Crie grupos de estudo, compartilhe arquivos, faça enquetes e converse com colegas.',
    color: '#06b6d4',
  },
  {
    icon: FolderOpen,
    title: 'Materiais',
    description: 'Centralize PDFs, links e materiais de estudo por matéria e semana.',
    color: '#f97316',
  },
  {
    icon: MessageCircle,
    title: 'Haki — Sua IA',
    description: 'Seu assistente de estudos com IA! Tire dúvidas, peça resumos, monte planos de estudo e muito mais.',
    color: 'hsl(var(--primary))',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      >
        {/* Skip button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          <X size={16} />
          Pular
        </button>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-3xl bg-card border border-border/50 shadow-2xl overflow-hidden">
            {/* Header illustration */}
            <div
              className="relative h-44 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${step.color}22, ${step.color}11)`,
              }}
            >
              {/* Decorative circles */}
              <div
                className="absolute w-32 h-32 rounded-full opacity-10"
                style={{ background: step.color, top: -16, right: -16 }}
              />
              <div
                className="absolute w-20 h-20 rounded-full opacity-10"
                style={{ background: step.color, bottom: 8, left: 8 }}
              />

              {currentStep === steps.length - 1 ? (
                <img src={hakiAvatar} alt="Haki" className="w-24 h-24 rounded-full shadow-lg" />
              ) : (
                <motion.div
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `${step.color}20`, border: `2px solid ${step.color}40` }}
                >
                  <StepIcon size={36} style={{ color: step.color }} />
                </motion.div>
              )}
            </div>

            {/* Content */}
            <div className="px-6 pt-5 pb-6 space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className="transition-all duration-300"
                  >
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep ? 'w-6' : 'w-1.5'
                      }`}
                      style={{
                        background: i === currentStep ? step.color : 'hsl(var(--muted-foreground) / 0.3)',
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!isFirst && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(s => s - 1)}
                    className="flex-1"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => isLast ? onComplete() : setCurrentStep(s => s + 1)}
                  className="flex-1"
                  style={{
                    background: step.color,
                    color: '#fff',
                  }}
                >
                  {isLast ? (
                    <>
                      <Sparkles size={16} />
                      Começar!
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight size={16} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Step counter */}
          <p className="text-center text-xs text-white/50 mt-3">
            {currentStep + 1} de {steps.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
