import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CompleteActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityTitle: string;
  activityType: string;
  onConfirm: (grade: number | null) => void;
}

const activityTypeLabels: Record<string, string> = {
  prova: 'Prova',
  trabalho: 'Trabalho',
  seminario: 'Seminário',
  exercicio: 'Exercício',
};

const CompleteActivityDialog = ({ open, onOpenChange, activityTitle, activityType, onConfirm }: CompleteActivityDialogProps) => {
  const [grade, setGrade] = useState('');
  const [touched, setTouched] = useState(false);

  const numericGrade = grade ? parseFloat(grade) : null;
  const isValid = numericGrade === null || (numericGrade >= 0 && numericGrade <= 10);
  const hasGrade = numericGrade !== null && isValid;

  const handleConfirm = () => {
    onConfirm(hasGrade ? numericGrade : null);
    setGrade('');
    setTouched(false);
  };

  const handleSkip = () => {
    onConfirm(null);
    setGrade('');
    setTouched(false);
  };

  const getGradeColor = () => {
    if (!hasGrade) return '';
    if (numericGrade! >= 7) return 'text-success';
    if (numericGrade! >= 5) return 'text-warning';
    return 'text-destructive';
  };

  const getGradeEmoji = () => {
    if (!hasGrade) return '';
    if (numericGrade! >= 9) return '🏆';
    if (numericGrade! >= 7) return '🎉';
    if (numericGrade! >= 5) return '👍';
    return '💪';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] rounded-2xl">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15"
          >
            <Trophy className="h-7 w-7 text-success" />
          </motion.div>
          <DialogTitle className="text-lg">Concluir {activityTypeLabels[activityType] || 'Atividade'}</DialogTitle>
          <DialogDescription className="text-xs">
            <span className="font-medium text-foreground">{activityTitle}</span>
            <br />
            Qual foi a nota? Isso ajuda a calcular sua média.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Grade input */}
          <div className="space-y-2">
            <div className="relative">
              <Star size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="Ex: 8.5"
                value={grade}
                onChange={e => { setGrade(e.target.value); setTouched(true); }}
                className={cn(
                  'pl-9 text-center text-lg font-bold h-12 rounded-xl',
                  hasGrade && getGradeColor()
                )}
                autoFocus
              />
            </div>

            {/* Grade feedback */}
            <AnimatePresence>
              {hasGrade && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn('text-center text-sm font-medium', getGradeColor())}
                >
                  {getGradeEmoji()} {numericGrade! >= 7 ? 'Ótimo resultado!' : numericGrade! >= 5 ? 'Continue se esforçando!' : 'Não desanime, você consegue!'}
                </motion.div>
              )}
            </AnimatePresence>

            {touched && !isValid && (
              <p className="text-xs text-destructive text-center">A nota deve ser entre 0 e 10</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 rounded-xl gap-1.5"
            >
              <SkipForward size={14} />
              Pular
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid}
              className="flex-1 rounded-xl gap-1.5 bg-success text-success-foreground hover:bg-success/90"
            >
              <Trophy size={14} />
              {hasGrade ? 'Salvar Nota' : 'Concluir'}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Você pode adicionar ou editar a nota depois
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteActivityDialog;
